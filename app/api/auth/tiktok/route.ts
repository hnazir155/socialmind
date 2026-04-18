import { NextResponse } from 'next/server';
import { tiktokAuthUrl } from '@/lib/platforms';

export async function GET() {
  if (!process.env.TIKTOK_CLIENT_KEY) {
    return NextResponse.json({
      error: 'TIKTOK_CLIENT_KEY not configured',
      help: 'Apply at https://developers.tiktok.com — Content Posting API requires approval (2-8 weeks).',
    }, { status: 500 });
  }
  return NextResponse.redirect(tiktokAuthUrl());
}
