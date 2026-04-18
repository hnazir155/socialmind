/* ============================================================
   TELEGRAM INTEGRATION
   Sends agent notifications to your phone, handles button taps.
   ============================================================ */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const API_BASE = 'https://api.telegram.org';

type InlineButton = { text: string; callback_data?: string; url?: string };
type InlineKeyboard = InlineButton[][];

/* ============================================================
   CORE SEND - used by everything below
   ============================================================ */
export async function sendTelegram(
  text: string,
  opts: {
    keyboard?: InlineKeyboard;
    parse_mode?: 'HTML' | 'MarkdownV2';
    silent?: boolean;
  } = {}
): Promise<{ ok: boolean; message_id?: number; error?: string }> {
  if (!BOT_TOKEN || !CHAT_ID) {
    return { ok: false, error: 'Telegram not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)' };
  }

  try {
    const body: any = {
      chat_id: CHAT_ID,
      text,
      parse_mode: opts.parse_mode || 'HTML',
      disable_notification: !!opts.silent,
    };
    if (opts.keyboard) {
      body.reply_markup = { inline_keyboard: opts.keyboard };
    }

    const res = await fetch(`${API_BASE}/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.ok) {
      return { ok: false, error: data.description || 'Unknown Telegram error' };
    }
    return { ok: true, message_id: data.result?.message_id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/* ============================================================
   ANSWER CALLBACK QUERY - removes the loading spinner on button tap
   ============================================================ */
export async function answerCallback(callbackQueryId: string, text?: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`${API_BASE}/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || 'Processing…',
      }),
    });
  } catch {}
}

/* ============================================================
   EDIT MESSAGE - update a message after user tapped a button
   ============================================================ */
export async function editTelegramMessage(messageId: number, text: string, keyboard?: InlineKeyboard) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`${API_BASE}/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
      }),
    });
  } catch {}
}

/* ============================================================
   HIGH-LEVEL HELPERS - these are what the rest of the app uses
   ============================================================ */

export async function notifyDraftReady(draft: {
  id?: string;
  hook?: string;
  platform?: string;
  format?: string;
  caption?: string;
  topic?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://socialmind-two.vercel.app';
  const hook = draft.hook || draft.topic || 'New draft';
  const platform = (draft.platform || '').toUpperCase();
  const format = (draft.format || '').replace(/_/g, ' ').toUpperCase();

  const text = [
    `📝 <b>New Draft Ready</b>`,
    ``,
    `💡 <i>${escapeHtml(hook)}</i>`,
    ``,
    `📱 ${platform}  ·  🎬 ${format}`,
    draft.caption ? `\n📄 ${escapeHtml(draft.caption.slice(0, 120))}${draft.caption.length > 120 ? '…' : ''}` : '',
  ].filter(Boolean).join('\n');

  const keyboard: InlineKeyboard = [];
  if (draft.id) {
    keyboard.push([
      { text: '✅ Approve', callback_data: `approve:${draft.id}` },
      { text: '❌ Reject', callback_data: `reject:${draft.id}` },
    ]);
  }
  keyboard.push([
    { text: '👀 Review in App', url: `${appUrl}/approval` },
  ]);

  return sendTelegram(text, { keyboard });
}

export async function notifyAgentActivity(rule_name: string, action: string, detail?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://socialmind-two.vercel.app';
  const text = [
    `🤖 <b>Agent Activity</b>`,
    ``,
    `⚡ <b>${escapeHtml(rule_name)}</b>`,
    `${escapeHtml(action)}`,
    detail ? `\n<i>${escapeHtml(detail)}</i>` : '',
  ].filter(Boolean).join('\n');

  return sendTelegram(text, {
    keyboard: [[{ text: '📜 Audit Log', url: `${appUrl}/audit` }]],
    silent: true,
  });
}

export async function notifyTrendSpike(trend: { title: string; velocity?: number; platform?: string; topic?: string }) {
  const text = [
    `🔥 <b>Trend Spike Detected</b>`,
    ``,
    `<b>${escapeHtml(trend.title)}</b>`,
    trend.velocity ? `📈 Velocity: +${trend.velocity}%` : '',
    trend.platform ? `📱 ${trend.platform.toUpperCase()}` : '',
    ``,
    `Want the agents to draft content?`,
  ].filter(Boolean).join('\n');

  return sendTelegram(text, {
    keyboard: [
      [
        { text: '🚀 Draft 3 variants', callback_data: `draft-trend:${trend.topic || trend.title}` },
        { text: '🙅 Ignore', callback_data: 'ignore-trend' },
      ],
    ],
  });
}

export async function notifyAlert(level: 'info' | 'warn' | 'error', message: string) {
  const icon = level === 'error' ? '🚨' : level === 'warn' ? '⚠️' : 'ℹ️';
  return sendTelegram(`${icon} <b>${level.toUpperCase()}</b>\n\n${escapeHtml(message)}`, { silent: level === 'info' });
}

export async function testTelegram() {
  const text = [
    `🎉 <b>SocialMind is connected!</b>`,
    ``,
    `Your agents can now ping you here when:`,
    `• New drafts are ready for approval`,
    `• Trends spike in your niche`,
    `• Automations fire unusual actions`,
    `• Posts need your attention`,
    ``,
    `Tap a button below to test.`,
  ].join('\n');

  return sendTelegram(text, {
    keyboard: [
      [{ text: '✅ Works!', callback_data: 'test-ok' }],
      [{ text: '👀 Open App', url: process.env.NEXT_PUBLIC_APP_URL || 'https://socialmind-two.vercel.app' }],
    ],
  });
}

/* ============================================================
   UTILS
   ============================================================ */
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function isTelegramConfigured(): boolean {
  return !!(BOT_TOKEN && CHAT_ID);
}
