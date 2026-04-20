'use client';
import { useEffect, useState } from 'react';

export default function OutreachQueue() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/growth/outreach?status=${filter}`);
    const d = await res.json();
    setMessages(d.messages || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/growth/outreach', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) });
    load();
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert('Copied!'); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Outreach<br /><em>Queue</em></h2>
          <div className="page-sub">{messages.length} messages · review & approve before sending</div>
        </div>
      </div>

      <div className="tab-bar">
        {['pending_approval','approved','sent'].map(s => (
          <button key={s} className={`tab ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
            {s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading && <div className="empty"><span className="loading"/></div>}

      {!loading && messages.length === 0 && (
        <div className="empty">
          <div className="empty-icon">✉️</div>
          <div style={{fontSize:14,color:'var(--ink-dim)',marginBottom:8}}>No {filter.replace('_',' ')} messages</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Go to Pipeline → Draft Outreach to create messages</div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        {messages.map((m:any) => (
          <div key={m.id} className="panel">
            <div className="panel-header">
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div>
                  <div className="panel-title">{m.prospects?.name || 'Prospect'}</div>
                  <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:2}}>{m.prospects?.country} · {m.prospects?.industry}</div>
                </div>
                <span style={{fontFamily:'var(--mono)',fontSize:10,padding:'4px 9px',borderRadius:999,background:'var(--bg-3)',color:'var(--ink-faint)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{m.channel} · Variant {m.variant}</span>
              </div>
              <span style={{fontFamily:'var(--mono)',fontSize:10,padding:'4px 9px',borderRadius:999,background:m.status==='approved'?'rgba(0,184,122,0.12)':'rgba(255,184,0,0.15)',color:m.status==='approved'?'var(--accent-3)':'#b08000',letterSpacing:'0.1em',textTransform:'uppercase'}}>{m.status.replace('_',' ')}</span>
            </div>
            <div className="panel-body">
              {m.subject && <div style={{fontWeight:700,color:'var(--ink)',fontSize:13,marginBottom:10}}>📌 {m.subject}</div>}
              <div style={{background:'var(--bg-3)',borderRadius:10,padding:16,fontSize:13,lineHeight:1.7,color:'var(--ink-dim)',whiteSpace:'pre-wrap',marginBottom:16}}>{m.body}</div>
              <div style={{display:'flex',gap:8}}>
                {m.status === 'pending_approval' && (
                  <button className="btn btn-approve" onClick={()=>updateStatus(m.id,'approved')}>✅ Approve</button>
                )}
                <button className="btn btn-ghost" onClick={()=>copyToClipboard(m.body)}>📋 Copy</button>
                {m.status === 'approved' && (
                  <button className="btn btn-primary" onClick={()=>updateStatus(m.id,'sent')}>📤 Mark as Sent</button>
                )}
                <button className="btn btn-reject" onClick={()=>updateStatus(m.id,'rejected')}>✕ Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
