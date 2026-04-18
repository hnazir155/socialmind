import { NextResponse } from 'next/server';
import { youtubeAuthUrl } from '@/lib/platforms';

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      error: 'GOOGLE_CLIENT_ID not configured',
      help: 'Get OAuth credentials at https://console.cloud.google.com/apis/credentials. Enable YouTube Data API v3.',
    }, { status: 500 });
  }
  return NextResponse.redirect(youtubeAuthUrl());
}
