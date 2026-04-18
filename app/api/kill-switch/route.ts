import { NextRequest, NextResponse } from 'next/server';
import { isPaused, setPaused } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ paused: await isPaused() });
}

export async function POST(req: NextRequest) {
  const { paused } = await req.json();
  await setPaused(!!paused);
  return NextResponse.json({ paused: !!paused });
}
