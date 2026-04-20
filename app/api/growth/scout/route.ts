import { NextRequest, NextResponse } from 'next/server';
import { runScoutMission } from '@/lib/growth-agents';
import { notifyTelegramMissionComplete } from '@/lib/telegram-growth';
import { getSupabase, memDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PRESETS: Record<string, {query:string;market:string;industry:string}[]> = {
  UAE: [
    { query:'beauty skincare stores Dubai', market:'UAE', industry:'beauty' },
    { query:'fashion boutiques Dubai Abu Dhabi', market:'UAE', industry:'fashion' },
    { query:'online stores e-commerce UAE', market:'UAE', industry:'e-commerce' },
  ],
  PK: [
    { query:'clothing brand online store Lahore', market:'PK', industry:'fashion' },
    { query:'e-commerce Shopify store Pakistan', market:'PK', industry:'e-commerce' },
    { query:'education institute online Pakistan', market:'PK', industry:'education' },
  ],
  UK: [
    { query:'Shopify beauty brand London UK', market:'UK', industry:'beauty' },
    { query:'D2C brand UK e-commerce', market:'UK', industry:'e-commerce' },
  ],
  US: [
    { query:'Shopify beauty brand USA', market:'US', industry:'beauty' },
    { query:'D2C fitness supplement brand USA', market:'US', industry:'fitness' },
  ],
  KSA: [
    { query:'fashion stores Riyadh Saudi Arabia', market:'KSA', industry:'fashion' },
    { query:'beauty stores Riyadh Jeddah', market:'KSA', industry:'beauty' },
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, market, industry, limit, preset } = body;

  let missions: {query:string;market:string;industry:string}[] = [];
  if (preset === 'all') {
    Object.keys(PRESETS).forEach(mkt => { const m = PRESETS[mkt]?.[0]; if (m) missions.push(m); });
  } else if (preset && PRESETS[preset]) {
    missions = [PRESETS[preset][0]!];
  } else if (query && market && industry) {
    missions = [{ query, market, industry }];
  } else {
    return NextResponse.json({ error: 'Provide query+market+industry or preset' }, { status: 400 });
  }

  const results = [];
  const sb = getSupabase();

  for (const mission of missions) {
    let savedMission: any = { ...mission, status: 'running', started_at: new Date().toISOString() };
    if (sb) {
      const { data } = await sb.from('scout_missions').insert(savedMission).select().single();
      savedMission = data || savedMission;
    } else {
      savedMission = memDB.insert('scout_missions', savedMission);
    }

    const result = await runScoutMission({ ...mission, id: savedMission.id, limit: limit || 12 });

    const update = { status:'done', completed_at:new Date().toISOString(), prospects_found:result.found, hot_leads:result.hot };
    if (sb && savedMission.id) {
      await sb.from('scout_missions').update(update).eq('id', savedMission.id);
    } else if (savedMission.id) {
      memDB.update('scout_missions', savedMission.id, update);
    }

    await notifyTelegramMissionComplete(mission, result).catch(() => {});
    results.push({ mission: mission.query, ...result });
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('scout_missions').select('*').order('created_at', { ascending: false }).limit(20);
    return NextResponse.json({ missions: data || [], presets: PRESETS });
  }
  return NextResponse.json({ missions: memDB.list('scout_missions') || [], presets: PRESETS });
}
