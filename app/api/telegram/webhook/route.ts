import { NextRequest, NextResponse } from 'next/server';
import { answerCallback, editTelegramMessage, sendTelegram } from '@/lib/telegram';
import { getSupabase, memDB } from '@/lib/db';
import { scriptAgent } from '@/lib/agents';
import { logAudit } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ============================================================
   TELEGRAM WEBHOOK
   Telegram calls this whenever you tap a button in the bot chat.
   Security: we check the optional secret token header if set.
   ============================================================ */

export async function POST(req: NextRequest) {
  // Optional security check — if TELEGRAM_WEBHOOK_SECRET is set, enforce it
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
    if (headerSecret !== secret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  // Handle callback queries (button taps)
  if (body.callback_query) {
    const cq = body.callback_query;
    const data: string = cq.data || '';
    const messageId: number = cq.message?.message_id;

    const [action, ...rest] = data.split(':');
    const param = rest.join(':');

    try {
      await answerCallback(cq.id, '✓ Got it');

      switch (action) {
        case 'approve': {
          const draftId = param;
          await updateDraftStatus(draftId, 'approved');
          await logAudit({ rule_name: 'Telegram', action: `Draft ${draftId.slice(0,8)} approved via phone`, result: 'ok', detail: '' });
          if (messageId) {
            await editTelegramMessage(messageId, `✅ <b>Approved</b>\n\nDraft moved to publish queue.`);
          }
          break;
        }
        case 'reject': {
          const draftId = param;
          await updateDraftStatus(draftId, 'rejected');
          await logAudit({ rule_name: 'Telegram', action: `Draft ${draftId.slice(0,8)} rejected via phone`, result: 'ok', detail: '' });
          if (messageId) {
            await editTelegramMessage(messageId, `❌ <b>Rejected</b>\n\nDraft removed from queue.`);
          }
          break;
        }
        case 'draft-trend': {
          const topic = param || 'trending topic';
          // Fire and forget - generate drafts in background
          generateTrendDrafts(topic).catch(() => {});
          if (messageId) {
            await editTelegramMessage(messageId, `🚀 <b>Drafting 3 variants</b>\n\nYou'll get a notification when ready.`);
          }
          break;
        }
        case 'ignore-trend': {
          if (messageId) {
            await editTelegramMessage(messageId, `🙅 <b>Ignored</b>\n\nWon't draft for this trend.`);
          }
          break;
        }
        case 'test-ok': {
          if (messageId) {
            await editTelegramMessage(messageId, `🎉 <b>Perfect! Everything works.</b>\n\nYour agents will now ping you when they need approval.`);
          }
          break;
        }
        default: {
          await sendTelegram(`⚠️ Unknown action: ${action}`, { silent: true });
        }
      }
    } catch (err: any) {
      await sendTelegram(`❌ Error: ${err.message}`, { silent: true });
    }
  }

  // Handle plain text messages (future: conversational agent commands)
  if (body.message?.text) {
    const text: string = body.message.text.trim().toLowerCase();
    if (text === '/start' || text === 'hi' || text === 'hello') {
      await sendTelegram(
        `👋 <b>SocialMind is listening!</b>\n\nI'll ping you when:\n• Drafts need approval\n• Trends spike\n• Something needs attention\n\nTap the buttons I send to take action.`,
        { silent: true }
      );
    } else if (text === '/status') {
      const count = await getPendingDraftCount();
      await sendTelegram(`📊 ${count} draft(s) awaiting your approval.`);
    } else if (text === '/help') {
      await sendTelegram(
        `<b>Commands:</b>\n/status — pending drafts count\n/help — this message\n\nMostly just respond to the buttons I send you.`,
        { silent: true }
      );
    }
  }

  return NextResponse.json({ ok: true });
}

/* ============================================================
   HELPERS
   ============================================================ */

async function updateDraftStatus(id: string, status: string) {
  const sb = getSupabase();
  if (sb) {
    await sb.from('drafts').update({ status }).eq('id', id);
    return;
  }
  memDB.update('drafts', id, { status });
}

async function getPendingDraftCount(): Promise<number> {
  const sb = getSupabase();
  if (sb) {
    const { count } = await sb.from('drafts').select('*', { count: 'exact', head: true }).eq('status', 'draft');
    return count || 0;
  }
  const list = memDB.list('drafts') as any[];
  return list.filter(d => d.status === 'draft').length;
}

async function generateTrendDrafts(topic: string) {
  const platforms: Array<'instagram' | 'tiktok' | 'youtube'> = ['instagram', 'tiktok', 'youtube'];
  for (const platform of platforms) {
    try {
      const result = await scriptAgent({ topic, platform, format: 'reel' });
      const sb = getSupabase();
      const draft = {
        topic, format: 'reel', platform, status: 'draft', content: result,
        hook: result.hook, caption: result.caption, hashtags: result.hashtags,
        created_at: new Date().toISOString(),
      };
      if (sb) await sb.from('drafts').insert(draft);
      else memDB.insert('drafts', draft);
    } catch {}
  }
  await sendTelegram(`✅ <b>3 drafts ready</b>\n\nTap to review them.`, {
    keyboard: [[{ text: '👀 Open Approval Queue', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://socialmind-two.vercel.app'}/approval` }]],
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Telegram webhook is live' });
}
