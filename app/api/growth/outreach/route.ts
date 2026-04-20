import { NextRequest, NextResponse } from 'next/server';
import { outreachAgent } from '@/lib/growth-agents';
import { notifyTelegramDraftOutreach } from '@/lib/telegram-growth';
import { getSupabase, memDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospect_id, channel } = body;

  const sb = getSupabase();
  let prospect: any = null;

  if (sb) {
    const { data } = await sb.from('prospects').select('*').eq('id', prospect_id).single();
    prospect = data;
  } else {
    const list = memDB.list('prospects') as any[];
    prospect = list.find((p: any) => p.id === prospect_id);
  }

  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

  const qual = {
    score: prospect.qualification_score,
    icp_fit: prospect.icp_fit,
    reason: prospect.score_reason,
    pain_signals: prospect.pain_signals || [],
    recommended_service: (prospect.enrichment as any)?.opportunity || 'Meta Ads',
    outreach_angle: prospect.score_reason || '',
  };

  const bestChannel = channel || (prospect.enrichment as any)?.best_channel || 'email';
  const drafts = await outreachAgent(prospect, qual, bestChannel);

  // Save all 3 variants
  const saved = [];
  for (const d of drafts) {
    const msg = {
      prospect_id: prospect.id,
      channel: d.channel,
      subject: d.subject,
      body: d.body,
      variant: d.variant,
      status: 'pending_approval',
      created_at: new Date().toISOString(),
    };
    if (sb) {
      const { data } = await sb.from('outreach_messages').insert(msg).select().single();
      saved.push(data);
    } else {
      saved.push(memDB.insert('outreach_messages', msg));
    }
  }

  // Update prospect stage
  const stageUpdate = { stage: 'outreach_drafted', last_touched_at: new Date().toISOString() };
  if (sb) await sb.from('prospects').update(stageUpdate).eq('id', prospect.id);
  else memDB.update('prospects', prospect.id, stageUpdate);

  // Notify Telegram
  await notifyTelegramDraftOutreach(prospect, saved).catch(() => {});

  return NextResponse.json({ ok: true, drafts: saved });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prospect_id = searchParams.get('prospect_id');
  const status = searchParams.get('status');

  const sb = getSupabase();
  if (sb) {
    let q = sb.from('outreach_messages').select('*, prospects(name, country, industry)').order('created_at', { ascending: false }).limit(50);
    if (prospect_id) q = q.eq('prospect_id', prospect_id);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    return NextResponse.json({ messages: data || [] });
  }

  let list = (memDB.list('outreach_messages') || []) as any[];
  if (prospect_id) list = list.filter((m:any) => m.prospect_id === prospect_id);
  if (status) list = list.filter((m:any) => m.status === status);
  return NextResponse.json({ messages: list });
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('outreach_messages').update(updates).eq('id', id).select().single();
    return NextResponse.json({ message: data });
  }
  return NextResponse.json({ message: memDB.update('outreach_messages', id, updates) });
}
