'use client';

import { useEffect, useState } from 'react';

export default function Calendar() {
  const [drafts, setDrafts] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/drafts').then(r => r.json()).then(d => setDrafts(d.drafts || []));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Content<br /><em>Calendar</em></h2>
          <div className="page-sub">Week view · all 4 platforms</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          {drafts.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⌧</div>
              <div style={{fontSize:14,color:'var(--ink-dim)'}}>No scheduled content yet</div>
              <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8}}>Generate scripts in Studio → approve → schedule here</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'120px repeat(7,1fr)',gap:1,background:'var(--line)',border:'1px solid var(--line)',borderRadius:6,overflow:'hidden'}}>
              {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <div key={`h-${i}`} style={{background:'var(--bg-3)',padding:12,fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--ink-dim)',textAlign:'center'}}>{d}</div>
              ))}
              {['Facebook', 'Instagram', 'TikTok', 'YouTube'].flatMap((p) => [
                <div key={`label-${p}`} style={{background:'var(--bg-2)',padding:12,fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--ink-dim)',display:'flex',alignItems:'center'}}>{p}</div>,
                ...[0,1,2,3,4,5,6].map(d => (
                  <div key={`${p}-${d}`} style={{background:'var(--bg-2)',padding:12,minHeight:80,fontSize:12}}>
                    {drafts.filter((dr) => dr.platform === p.toLowerCase() && new Date(dr.created_at).getDay() === ((d + 1) % 7)).slice(0, 1).map((dr) => (
                      <div key={dr.id} style={{background:'var(--bg-3)',borderLeft:`2px solid ${dr.status === 'posted' ? 'var(--ink-faint)' : 'var(--accent)'}`,padding:'6px 8px',borderRadius:3,fontSize:11}}>
                        <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink-faint)'}}>{new Date(dr.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                        {(dr.topic || '').slice(0, 30)}
                      </div>
                    ))}
                  </div>
                ))
              ])}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
