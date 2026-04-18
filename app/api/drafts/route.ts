import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, memDB } from '@/lib/db';
import { notifyDraftReady, isTelegramConfigured } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function GET() {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('drafts').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ drafts: data });
  }
  return NextResponse.json({ drafts: memDB.list('drafts'), _note: 'Using in-memory store (no Supabase configured)' });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sb = getSupabase();
  let draft: any;
  if (sb) {
    const { data, error } = await sb.from('drafts').insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    draft = data;
  } else {
    draft = memDB.insert('drafts', body);
  }

  // Ping Telegram when user requests it or for agent-created drafts
  if (isTelegramConfigured() && body.notify !== false) {
    const content = body.content || body;
    notifyDraftReady({
      id: draft.id,
      hook: content.hook || body.hook || body.topic,
      platform: body.platform,
      format: body.format,
      caption: content.caption || body.caption,
      topic: body.topic,
    }).catch(() => {});
  }

  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('drafts').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ draft: data });
  }
  const draft = memDB.update('drafts', id, updates);
  return NextResponse.json({ draft });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('drafts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  memDB.remove('drafts', id);
  return NextResponse.json({ ok: true });
}
