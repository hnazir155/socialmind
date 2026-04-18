import { NextRequest, NextResponse } from 'next/server';
import { metaExchangeCode } from '@/lib/platforms';
import { encrypt } from '@/lib/crypto';
import { getSupabase, memDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=${error}`);
  }
  if (!code) return NextResponse.json({ error: 'No code returned' }, { status: 400 });

  const tokenData = await metaExchangeCode('facebook', code);
  if (!tokenData.access_token) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 500 });
  }

  // Get user info to display the handle
  const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${tokenData.access_token}`);
  const me = await meRes.json();

  const conn = {
    platform: 'facebook',
    handle: me.name || 'Connected',
    encrypted_token: encrypt(tokenData.access_token),
    expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
  };

  const sb = getSupabase();
  if (sb) {
    await sb.from('connections').upsert(conn, { onConflict: 'platform' });
  } else {
    memDB.insert('connections', conn);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?success=facebook`);
}
