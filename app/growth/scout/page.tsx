'use client';
import { useEffect, useState } from 'react';

const MARKETS = ['UAE','PK','UK','US','KSA'];
const INDUSTRIES = ['beauty','fashion','e-commerce','food & beverage','education','real estate','fitness','electronics','jewelry','retail'];
const FLAG: Record<string,string> = { UAE:'🇦🇪', PK:'🇵🇰', UK:'🇬🇧', US:'🇺🇸', KSA:'🇸🇦' };

export default function Scout() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [market, setMarket] = useState('UAE');
  const [industry, setIndustry] = useState('beauty');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/growth/scout');
    const d = await res.json();
    setMissions(d.missions || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runMission = async (preset?: string) => {
    setRunning(true);
    setResult(null);
    const body = preset ? { preset } : { query: query || `${industry} businesses ${market}`, market, industry, limit: 12 };
    const res = await fetch('/api/growth/scout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await res.json();
    setResult(d);
    setRunning(false);
    load();
  };

  const totalHot = missions.reduce((a,m)=>a+(m.hot_leads||0),0);
  const totalFound = missions.reduce((a,m)=>a+(m.prospects_found||0),0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Prospect<br /><em>Scout</em></h2>
          <div className="page-sub">{missions.length} missions run · {totalFound} prospects found · {totalHot} hot leads</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:32}}>
        {/* Custom mission */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Custom Mission</div></div>
          <div className="panel-body">
            <label className="input-label">Market</label>
            <div className="pill-group" style={{marginBottom:16}}>
              {MARKETS.map(m => <button key={m} className={`pill ${market===m?'active':''}`} onClick={()=>setMarket(m)}>{FLAG[m]} {m}</button>)}
            </div>
            <label className="input-label">Industry</label>
            <div className="pill-group" style={{marginBottom:16}}>
              {INDUSTRIES.map(i => <button key={i} className={`pill ${industry===i?'active':''}`} onClick={()=>setIndustry(i)}>{i}</button>)}
            </div>
            <label className="input-label">Custom Query (optional)</label>
            <input className="input" placeholder={`e.g. "Shopify beauty stores Dubai"`} value={query} onChange={e=>setQuery(e.target.value)} />
            <button className="btn btn-primary" disabled={running} style={{width:'100%'}} onClick={()=>runMission()}>
              {running ? <><span className="loading"/> Scouting…</> : '🔍 Run Mission'}
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Quick Presets</div></div>
          <div className="panel-body">
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {MARKETS.map(m => (
                <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--bg-3)',borderRadius:10,border:'1px solid var(--line)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:'var(--ink)'}}>{FLAG[m]} {m}</div>
                    <div style={{fontSize:11,color:'var(--ink-faint)'}}>Top opportunities in {m}</div>
                  </div>
                  <button className="btn btn-ghost" disabled={running} style={{fontSize:11,padding:'6px 12px'}} onClick={()=>runMission(m)}>Scout →</button>
                </div>
              ))}
              <div style={{padding:'10px 14px',background:'linear-gradient(135deg,var(--bg-warm),var(--bg-2))',borderRadius:10,border:'1px solid var(--line-2)'}}>
                <div style={{fontWeight:600,fontSize:13,color:'var(--ink)',marginBottom:6}}>🌍 All Markets at Once</div>
                <div style={{fontSize:11,color:'var(--ink-faint)',marginBottom:10}}>One mission per market, all 5 regions simultaneously</div>
                <button className="btn btn-primary" disabled={running} style={{width:'100%'}} onClick={()=>runMission('all')}>
                  {running?<><span className="loading"/> Running…</>:'🚀 Launch All Markets'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div style={{background:'var(--bg-warm)',border:'1px solid var(--line-2)',borderRadius:14,padding:24,marginBottom:32}}>
          <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:600,marginBottom:12}}>✅ Mission Complete</div>
          <div style={{display:'flex',gap:24}}>
            {result.results?.map((r:any,i:number) => (
              <div key={i} style={{flex:1,background:'var(--bg-2)',borderRadius:10,padding:16,border:'1px solid var(--line)'}}>
                <div style={{fontSize:12,color:'var(--ink-faint)',marginBottom:8}}>{r.mission}</div>
                <div style={{display:'flex',gap:16}}>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:'var(--display)',fontSize:32,color:'var(--ink)'}}>{r.found}</div><div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--ink-faint)'}}>SCANNED</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:'var(--display)',fontSize:32,color:'var(--accent)'}}>{r.hot}</div><div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--ink-faint)'}}>HOT 🔥</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:'var(--display)',fontSize:32,color:'var(--accent-4)'}}>{r.warm}</div><div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--ink-faint)'}}>WARM 🟡</div></div>
                </div>
              </div>
            ))}
          </div>
          <a href="/growth/pipeline" className="btn btn-primary" style={{display:'inline-block',marginTop:16}}>View in Pipeline →</a>
        </div>
      )}

      {running && (
        <div style={{textAlign:'center',padding:40,background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:14,marginBottom:32}}>
          <span className="loading" style={{width:24,height:24,borderWidth:3}}/><br/><br/>
          <div style={{fontFamily:'var(--display)',fontSize:18,color:'var(--ink)',marginBottom:8}}>Scout agents running…</div>
          <div style={{fontSize:12,color:'var(--ink-faint)'}}>Finding prospects → enriching with AI → scoring → notifying on Telegram</div>
          <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:8,fontFamily:'var(--mono)'}}>Hot leads will appear on your phone instantly</div>
        </div>
      )}

      {/* Past missions */}
      {missions.length > 0 && (
        <div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:16}}>Past Missions</div>
          <div style={{background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}>
            {missions.map((m,i) => (
              <div key={m.id||i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:16,padding:'14px 20px',borderBottom:i<missions.length-1?'1px solid var(--line)':'none',alignItems:'center'}}>
                <div><div style={{fontWeight:600,fontSize:13,color:'var(--ink)'}}>{FLAG[m.market]||''} {m.query}</div><div style={{fontSize:11,color:'var(--ink-faint)',marginTop:2}}>{m.market} · {m.industry}</div></div>
                <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)',fontWeight:700}}>🔥 {m.hot_leads||0} hot</div>
                <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-faint)'}}>{m.prospects_found||0} found</div>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:m.status==='done'?'var(--accent-3)':'var(--ink-faint)',textTransform:'uppercase'}}>{m.status}</div>
                <div style={{fontSize:11,color:'var(--ink-faint)'}}>{m.completed_at?new Date(m.completed_at).toLocaleDateString():''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
