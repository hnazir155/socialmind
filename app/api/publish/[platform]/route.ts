import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, memDB } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { postToFacebook, postToInstagram, postToTikTok, Platform } from '@/lib/platforms';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function getConnection(platform: string) {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('connections').select('*').eq('platform', platform).single();
    return data;
  }
  return memDB.list('connections').find((c: any) => c.platform === platform);
}

export async function POST(req: NextRequest, { params }: { params: { platform: string } }) {
  const platform = params.platform as Platform;
  const body = await req.json();
  const { caption, mediaUrl, draftId, pageId, igUserId } = body;

  const conn = await getConnection(platform);
  if (!conn) {
    return NextResponse.json({
      error: `${platform} not connected`,
      help: 'Go to Settings → Connections and connect this platform first.',
    }, { status: 400 });
  }

  let token: string;
  try {
    token = decrypt(conn.encrypted_token);
  } catch (e) {
    return NextResponse.json({ error: 'Token decryption failed - reconnect this platform' }, { status: 500 });
  }

  let result;
  try {
    switch (platform) {
      case 'facebook':
        if (!pageId) return NextResponse.json({ error: 'pageId required for Facebook posts' }, { status: 400 });
        result = await postToFacebook(pageId, token, caption, mediaUrl);
        break;
      case 'instagram':
        if (!igUserId || !mediaUrl) return NextResponse.json({ error: 'igUserId and mediaUrl required for Instagram' }, { status: 400 });
        result = await postToInstagram(igUserId, token, mediaUrl, caption);
        break;
      case 'tiktok':
        if (!mediaUrl) return NextResponse.json({ error: 'mediaUrl required for TikTok' }, { status: 400 });
        result = await postToTikTok(token, mediaUrl, caption);
        break;
      case 'youtube':
        return NextResponse.json({
          error: 'YouTube uploads require multipart file handling',
          help: 'Use the resumable upload endpoint with a video file Buffer. Not implemented in this stub.',
        }, { status: 501 });
      default:
        return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 404 });
    }

    // Mark draft as posted
    if (draftId) {
      const sb = getSupabase();
      const update = { status: 'posted', posted_at: new Date().toISOString(), platform_post_id: result.id || result.post_id };
      if (sb) await sb.from('drafts').update(update).eq('id', draftId);
      else memDB.update('drafts', draftId, update);
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}
