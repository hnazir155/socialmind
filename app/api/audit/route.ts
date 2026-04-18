import { NextResponse } from 'next/server';
import { listAudit } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await listAudit(100);
  return NextResponse.json({ entries });
}
