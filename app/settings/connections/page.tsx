'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', cls: 'fb', perms: 'pages_manage_posts, pages_read_engagement', help: 'Requires Meta App Review for production. Dev mode works for your own pages immediately.' },
  { id: 'instagram', name: 'Instagram', cls: 'ig', perms: 'instagram_content_publish, instagram_basic', help: 'Needs an Instagram Business or Creator account linked to a Facebook Page.' },
  { id: 'tiktok', name: 'TikTok', cls: 'tt', perms: 'video.publish, video.upload', help: 'Content Posting API requires app approval (2-8 weeks). Sandbox testing works during dev.' },
  { id: 'youtube', name: 'YouTube', cls: 'yt', perms: 'youtube.upload, youtube.readonly', help: 'OAuth consent screen needs verification (~2 weeks) for unrestricted use.' },
];

function ConnectionsInner() {
  const params = useSearchParams();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const successPlatform = params.get('success');
  const errorMsg = params.get('error');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/connections');
    const d = await res.json();
    setConnections(d.connections || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [successPlatform]);

  const disconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    await fetch('/api/connections', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ platform }) });
    load();
  };

  const getConn = (id: string) => connections.find((c: any) => c.platform === id);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Connect<br /><em>Platforms</em></h2>
          <div className="page-sub">{connections.length} of 4 connected · OAuth tokens stored encrypted</div>
        </div>
      </div>

      {successPlatform && (
        <div style={{padding:14,background:'rgba(110,255,200,0.1)',border:'1px solid var(--accent-3)',borderRadius:6,marginBottom:24,fontSize:13,color:'var(--accent-3)'}}>
          ✓ {successPlatform} connected successfully
        </div>
      )}
      {errorMsg && (
        <div style={{padding:14,background:'rgba(255,77,109,0.1)',border:'1px solid var(--danger)',borderRadius:6,marginBottom:24,fontSize:13,color:'var(--danger)'}}>
          ⚠ {errorMsg}
        </div>
      )}

      <div className="connect-grid">
        {PLATFORMS.map((p) => {
          const conn = getConn(p.id);
          return (
            <div key={p.id} className={`connect-card ${p.cls}`}>
              <div className="connect-card-header">
                <div>
                  <div className="connect-card-name">{p.name}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginTop:4}}>{p.id}</div>
                </div>
                <span className={`connect-status ${conn ? 'connected' : 'disconnected'}`}>{conn ? 'Connected' : 'Not Connected'}</span>
              </div>

              <div className="connect-meta">
                {conn ? (
                  <>
                    <div>Account: <strong>{conn.handle}</strong></div>
                    <div>Permissions: <span style={{fontFamily:'var(--mono)',fontSize:11}}>{p.perms}</span></div>
                    {conn.expires_at && <div>Expires: {new Date(conn.expires_at).toLocaleString()}</div>}
                  </>
                ) : (
                  <>
                    <div style={{marginBottom:8}}>Permissions you'll grant: <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink)'}}>{p.perms}</span></div>
                    <div style={{fontSize:11,color:'var(--ink-faint)',fontStyle:'italic'}}>{p.help}</div>
                  </>
                )}
              </div>

              <div style={{display:'flex',gap:8}}>
                {conn ? (
                  <>
                    <button className="btn btn-ghost" onClick={() => disconnect(p.id)}>Disconnect</button>
                    <a href={`/api/auth/${p.id}`} className="btn btn-ghost">Reconnect</a>
                  </>
                ) : (
                  <a href={`/api/auth/${p.id}`} className="btn btn-primary" style={{display:'inline-block'}}>Connect {p.name} →</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:32,padding:24,background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:8}}>
        <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:400,marginBottom:12}}>Setup Help</div>
        <div style={{fontSize:13,color:'var(--ink-dim)',lineHeight:1.7}}>
          <div style={{marginBottom:8}}>1. Get API credentials from each platform's developer portal:</div>
          <div style={{paddingLeft:20,fontSize:12,fontFamily:'var(--mono)',color:'var(--ink-faint)'}}>
            • Meta (FB+IG): <span style={{color:'var(--accent)'}}>developers.facebook.com</span><br/>
            • TikTok: <span style={{color:'var(--accent)'}}>developers.tiktok.com</span><br/>
            • YouTube: <span style={{color:'var(--accent)'}}>console.cloud.google.com</span>
          </div>
          <div style={{marginTop:12,marginBottom:8}}>2. Add the OAuth callback URLs to each app:</div>
          <div style={{paddingLeft:20,fontSize:12,fontFamily:'var(--mono)',color:'var(--ink-faint)'}}>
            <span style={{color:'var(--accent)'}}>{(typeof window !== 'undefined' ? window.location.origin : 'YOUR_APP_URL')}/api/auth/[platform]/callback</span>
          </div>
          <div style={{marginTop:12,marginBottom:8}}>3. Add credentials to your <code style={{color:'var(--accent)'}}>.env.local</code> (or Vercel env vars) — see <code style={{color:'var(--accent)'}}>.env.example</code></div>
        </div>
      </div>
    </div>
  );
}

export default function Connections() {
  return (
    <Suspense fallback={<div className="page"><div className="empty"><span className="loading"></span></div></div>}>
      <ConnectionsInner />
    </Suspense>
  );
}
