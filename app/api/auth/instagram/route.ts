import { NextResponse } from 'next/server';
import { metaAuthUrl } from '@/lib/platforms';

export async function GET() {
  if (!process.env.META_APP_ID) {
    return NextResponse.json({
      error: 'META_APP_ID not configured',
      help: 'Instagram uses the Meta Graph API. Get credentials at https://developers.facebook.com/apps',
    }, { status: 500 });
  }
  return NextResponse.redirect(metaAuthUrl('instagram'));
}
