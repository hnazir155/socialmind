'use client';

import { useEffect, useState } from 'react';

export default function AuditLog() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/audit');
    const d = await res.json();
    setEntries(d.entries || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Audit<br /><em>Log</em></h2>
          <div className="page-sub">Every autonomous action · live feed · auto-refresh 15s</div>
        </div>
        <button className="btn btn-ghost" onClick={load}>⟳ Refresh</button>
      </div>

      {loading && entries.length === 0 && <div className="empty"><span className="loading"></span></div>}

      {!loading && entries.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📜</div>
          <div style={{fontSize:14,color:'var(--ink-dim)',marginBottom:8}}>No agent activity yet</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Entries will appear once automations fire</div>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}>
          {entries.map((e, i) => (
            <div key={i} className="audit-entry">
              <div className="audit-time">
                {new Date(e.timestamp).toLocaleDateString([], {month:'short',day:'numeric'})}<br/>
                {new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
              </div>
              <div>
                <div className="audit-action">
                  <strong>{e.rule_name}</strong> · {e.action}
                </div>
                {e.detail && <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:4,fontFamily:'var(--mono)'}}>{e.detail}</div>}
              </div>
              <span className={`audit-result ${e.result}`}>{e.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
