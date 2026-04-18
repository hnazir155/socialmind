'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/drafts').then(r => r.json()).then(d => setDrafts(d.drafts || []));
    fetch('/api/connections').then(r => r.json()).then(d => setConnections(d.connections || []));
  }, []);

  const drafted = drafts.filter(d => d.status === 'draft' || !d.status).length;
  const scheduled = drafts.filter(d => d.status === 'scheduled').length;
  const posted = drafts.filter(d => d.status === 'posted').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome back,<br /><em>Acme.</em></h2>
          <div className="page-sub">{drafted} drafts awaiting · {connections.length} platforms connected</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Link href="/studio" className="btn btn-ghost">Open Studio</Link>
          <Link href="/approval" className="btn btn-primary">Review Queue ({drafted})</Link>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="stat">
          <div className="stat-label">Drafts in Queue</div>
          <div className="stat-value">{drafted}</div>
          <div className="stat-trend up">Awaiting your review</div>
        </div>
        <div className="stat">
          <div className="stat-label">Scheduled Posts</div>
          <div className="stat-value">{scheduled}</div>
          <div className="stat-trend up">Ready to go</div>
        </div>
        <div className="stat">
          <div className="stat-label">Live Posts</div>
          <div className="stat-value">{posted}</div>
          <div className="stat-trend up">Published this period</div>
        </div>
        <div className="stat">
          <div className="stat-label">Connected</div>
          <div className="stat-value">{connections.length}/4</div>
          <div className="stat-trend up">Platforms linked</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Agent Roster</div>
            <Link href="/agents" className="btn btn-ghost">Open Console</Link>
          </div>
          <div>
            {[
              { id: 'research', name: 'Research Agent', desc: 'Scans trending topics across 4 platforms', status: 'idle' },
              { id: 'strategist', name: 'Strategist Agent', desc: 'Builds weekly content plans', status: 'idle' },
              { id: 'script', name: 'Script & Creative', desc: 'Veo 3, Nano Banana, hooks, captions', status: 'idle' },
              { id: 'publisher', name: 'Publisher Agent', desc: 'Approval queue + posting', status: 'idle' },
              { id: 'analytics', name: 'Analytics Agent', desc: 'Performance loop', status: 'idle' },
            ].map((a) => (
              <Link key={a.id} href="/agents" style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:16,alignItems:'center',padding:'18px 24px',borderBottom:'1px solid var(--line)',color:'inherit'}}>
                <div className={`agent-icon ${a.id}`}>{a.id[0].toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{a.name}</div>
                  <div style={{fontSize:12,color:'var(--ink-dim)',marginTop:2}}>{a.desc}</div>
                </div>
                <span className={`agent-status ${a.status}`}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Quick Start</div>
          </div>
          <div className="panel-body">
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <Link href="/settings/connections" className="btn btn-ghost" style={{textAlign:'left',padding:'14px 16px'}}>
                <div style={{fontWeight:600,fontSize:13}}>1. Connect Platforms →</div>
                <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:4}}>Link FB, IG, TikTok, YouTube</div>
              </Link>
              <Link href="/training" className="btn btn-ghost" style={{textAlign:'left',padding:'14px 16px'}}>
                <div style={{fontWeight:600,fontSize:13}}>2. Train Brand Voice →</div>
                <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:4}}>Set tone, examples, banned words</div>
              </Link>
              <Link href="/studio" className="btn btn-ghost" style={{textAlign:'left',padding:'14px 16px'}}>
                <div style={{fontWeight:600,fontSize:13}}>3. Generate First Script →</div>
                <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:4}}>Veo 3, Nano Banana, Reels</div>
              </Link>
              <Link href="/approval" className="btn btn-primary" style={{textAlign:'left',padding:'14px 16px'}}>
                <div style={{fontWeight:600,fontSize:13}}>4. Approve & Publish →</div>
                <div style={{fontSize:11,opacity:0.7,marginTop:4}}>One-tap to all platforms</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
