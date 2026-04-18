import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   ONE-CLICK WEBHOOK SETUP
   Visit this URL once to tell Telegram where to send button taps.
   ============================================================ */
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN missing' }, { status: 400 });
  }
  if (!appUrl) {
    return NextResponse.json({ ok: false, error: 'NEXT_PUBLIC_APP_URL missing' }, { status: 400 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const body: any = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  };
  if (secret) {
    body.secret_token = secret;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return NextResponse.json({
    ok: data.ok,
    webhook_url: webhookUrl,
    secret_configured: !!secret,
    telegram_response: data,
  });
}
