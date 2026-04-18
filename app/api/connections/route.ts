import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, memDB } from '@/lib/db';

export async function GET() {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('connections').select('platform, handle, connected_at, expires_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ connections: data });
  }
  // Strip tokens before returning
  const safe = memDB.list('connections').map((c: any) => ({
    platform: c.platform,
    handle: c.handle,
    connected_at: c.created_at,
    expires_at: c.expires_at,
  }));
  return NextResponse.json({ connections: safe });
}

export async function DELETE(req: NextRequest) {
  const { platform } = await req.json();
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('connections').delete().eq('platform', platform);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const all = memDB.list('connections').filter((c: any) => c.platform !== platform);
  // Reset memory for that platform
  memDB.list('connections').length = 0;
  all.forEach((c: any) => memDB.insert('connections', c));
  return NextResponse.json({ ok: true });
}
