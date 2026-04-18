/* ============================================================
   PLATFORM OAUTH CONFIGURATION
   Each platform has a unique OAuth flow. We centralize them here.
   ============================================================ */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube';

export const PLATFORM_INFO = {
  facebook: { name: 'Facebook', color: '#1877f2', icon: 'f' },
  instagram: { name: 'Instagram', color: '#dc2743', icon: 'IG' },
  tiktok: { name: 'TikTok', color: '#ff0050', icon: 'TT' },
  youtube: { name: 'YouTube', color: '#ff0000', icon: 'YT' },
} as const;

/* --- META (Facebook + Instagram) --- */
export function metaAuthUrl(platform: 'facebook' | 'instagram') {
  const scope = platform === 'instagram'
    ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
    : 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile';
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    redirect_uri: `${APP_URL}/api/auth/${platform}/callback`,
    scope,
    response_type: 'code',
    state: platform,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function metaExchangeCode(platform: string, code: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    client_secret: process.env.META_APP_SECRET || '',
    redirect_uri: `${APP_URL}/api/auth/${platform}/callback`,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`);
  return res.json();
}

/* --- TIKTOK --- */
export function tiktokAuthUrl() {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || '',
    redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    scope: 'user.info.basic,video.publish,video.upload',
    response_type: 'code',
    state: 'tiktok',
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

export async function tiktokExchangeCode(code: string) {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    }),
  });
  return res.json();
}

/* --- YOUTUBE (Google OAuth) --- */
export function youtubeAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${APP_URL}/api/auth/youtube/callback`,
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: 'youtube',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function youtubeExchangeCode(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/api/auth/youtube/callback`,
    }),
  });
  return res.json();
}

/* --- POSTING FUNCTIONS --- */

export async function postToFacebook(pageId: string, accessToken: string, message: string, mediaUrl?: string) {
  const endpoint = mediaUrl
    ? `https://graph.facebook.com/v21.0/${pageId}/photos`
    : `https://graph.facebook.com/v21.0/${pageId}/feed`;
  const body: any = { message, access_token: accessToken };
  if (mediaUrl) body.url = mediaUrl;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function postToInstagram(igUserId: string, accessToken: string, mediaUrl: string, caption: string) {
  // Step 1: Create container
  const create = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: mediaUrl, caption, access_token: accessToken }),
  });
  const createJson = await create.json();
  if (!createJson.id) return createJson;

  // Step 2: Publish
  const publish = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: createJson.id, access_token: accessToken }),
  });
  return publish.json();
}

export async function postToYouTube(accessToken: string, videoFile: Buffer, metadata: any) {
  // Simplified — real implementation needs resumable upload
  const res = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'video/mp4',
    },
    body: videoFile as any,
  });
  return res.json();
}

export async function postToTikTok(accessToken: string, videoUrl: string, caption: string) {
  // Init upload
  const init = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
      post_info: { title: caption, privacy_level: 'SELF_ONLY' },
    }),
  });
  return init.json();
}
