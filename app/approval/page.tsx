'use client';

import { useEffect, useState } from 'react';

export default function ApprovalQueue() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/drafts');
    const d = await res.json();
    setDrafts(d.drafts || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reject = async (id: string) => {
    await fetch('/api/drafts', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    load();
  };

  const approve = async (draft: any) => {
    setPublishing(draft.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/publish/${draft.platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draft.id,
          caption: draft.content?.caption || '',
          mediaUrl: draft.mediaUrl,
          pageId: draft.pageId,
          igUserId: draft.igUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(`⚠ ${data.error}${data.help ? ' — ' + data.help : ''}`);
      } else {
        setMsg(`✓ Posted to ${draft.platform}`);
        load();
      }
    } catch (e: any) {
      setMsg(`⚠ ${e.message}`);
    } finally {
      setPublishing(null);
    }
  };

  const draftsOnly = drafts.filter(d => d.status === 'draft' || !d.status);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Awaiting<br /><em>Your Approval</em></h2>
          <div className="page-sub">{draftsOnly.length} drafts · review &amp; ship in seconds</div>
        </div>
      </div>

      {msg && <div style={{padding:14,background:'var(--bg-2)',border:'1px solid var(--line-2)',borderRadius:6,marginBottom:24,fontSize:13}}>{msg}</div>}

      {loading && <div className="empty"><span className="loading"></span></div>}

      {!loading && draftsOnly.length === 0 && (
        <div className="empty">
          <div className="empty-icon">∅</div>
          <div style={{fontSize:14,color:'var(--ink-dim)'}}>No drafts in the queue</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8}}>Generate one in Script Studio →</div>
        </div>
      )}

      <div className="queue-grid">
        {draftsOnly.map((d) => {
          const c = d.content || {};
          const platformClass = ({ facebook: 'fb', instagram: 'ig', tiktok: 'tt', youtube: 'yt' } as any)[d.platform] || 'fb';
          return (
            <div key={d.id} className="queue-card">
              <div className="queue-card-header">
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span className={`platform-tag ${platformClass}`}>{d.platform}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)'}}>{(d.format || '').toUpperCase()}</span>
                </div>
                <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)'}}>{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <div className="queue-card-body">
                {c.main_output && (
                  <div style={{padding:14,background:'var(--bg-3)',borderRadius:6,marginBottom:12,fontSize:12,fontFamily:'var(--mono)',whiteSpace:'pre-wrap',maxHeight:160,overflow:'auto'}}>
                    {c.main_output}
                  </div>
                )}
                <div className="queue-caption">{c.caption || d.topic}</div>
                {c.hashtags && (
                  <div className="queue-hashtags">
                    {[...(c.hashtags.primary || []), ...(c.hashtags.niche || [])].slice(0, 6).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}
                  </div>
                )}
                <div className="queue-actions">
                  <button className="btn btn-reject" onClick={() => reject(d.id)}>✕ Reject</button>
                  <button className="btn btn-ghost">Edit</button>
                  <button className="btn btn-approve" onClick={() => approve(d)} disabled={publishing === d.id}>
                    {publishing === d.id ? <><span className="loading"></span> Posting...</> : '✓ Approve & Post'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
