import { NextResponse } from 'next/server';
import { metaAuthUrl } from '@/lib/platforms';

export async function GET() {
  if (!process.env.META_APP_ID) {
    return NextResponse.json({
      error: 'META_APP_ID not configured',
      help: 'Get one at https://developers.facebook.com/apps and add META_APP_ID + META_APP_SECRET to your env vars.',
    }, { status: 500 });
  }
  return NextResponse.redirect(metaAuthUrl('facebook'));
}
