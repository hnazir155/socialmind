import { NextResponse } from 'next/server';
import { testTelegram, isTelegramConfigured } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars' }, { status: 400 });
  }
  const result = await testTelegram();
  return NextResponse.json(result);
}
