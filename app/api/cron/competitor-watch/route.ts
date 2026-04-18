import { NextRequest, NextResponse } from 'next/server';
import { runScheduled, isPaused, logAudit } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (await isPaused()) {
    return NextResponse.json({ ok: true, skipped: 'paused' });
  }
  const results = await runScheduled('competitor-watch');
  await logAudit({ rule_name: 'Cron', action: 'competitor-watch fired', result: 'ok', detail: `${results.length} rules evaluated` });
  return NextResponse.json({ ok: true, results });
}
