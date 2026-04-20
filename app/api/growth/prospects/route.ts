import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, memDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const icp_fit = searchParams.get('icp_fit');
  const market = searchParams.get('market');
  const limit = parseInt(searchParams.get('limit') || '100');

  const sb = getSupabase();
  if (sb) {
    let q = sb.from('prospects').select('*').order('qualification_score', { ascending: false }).limit(limit);
    if (stage) q = q.eq('stage', stage);
    if (icp_fit) q = q.eq('icp_fit', icp_fit);
    if (market) q = q.eq('country', market);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospects: data || [] });
  }

  let list = (memDB.list('prospects') || []) as any[];
  if (stage) list = list.filter((p:any) => p.stage === stage);
  if (icp_fit) list = list.filter((p:any) => p.icp_fit === icp_fit);
  if (market) list = list.filter((p:any) => p.country === market);
  return NextResponse.json({ prospects: list.slice(0, limit) });
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  updates.last_touched_at = new Date().toISOString();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('prospects').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospect: data });
  }
  return NextResponse.json({ prospect: memDB.update('prospects', id, updates) });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const sb = getSupabase();
  if (sb) {
    await sb.from('prospects').delete().eq('id', id);
  } else {
    memDB.remove('prospects', id);
  }
  return NextResponse.json({ ok: true });
}

// DELETE ALL — for clearing bad data
export async function OPTIONS() {
  const sb = getSupabase();
  if (sb) {
    await sb.from('prospects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  return NextResponse.json({ ok: true, cleared: true });
}
