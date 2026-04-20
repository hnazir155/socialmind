'use client';
import { useEffect, useState } from 'react';

const STAGES = [
  { id:'discovered', label:'Discovered', color:'#8a8373' },
  { id:'qualified', label:'Qualified', color:'#2e5bff' },
  { id:'outreach_drafted', label:'Draft Ready', color:'#ffb800' },
  { id:'contacted', label:'Contacted', color:'#c94dff' },
  { id:'responded', label:'Responded', color:'#ff4d2e' },
  { id:'meeting', label:'Meeting', color:'#00b87a' },
  { id:'won', label:'Won 🎉', color:'#00b87a' },
];
const FIT_COLORS: Record<string,string> = { hot:'var(--accent)', warm:'var(--accent-4)', cold:'var(--accent-2)', skip:'var(--ink-faint)', unscored:'var(--ink-faint)' };
const FLAG: Record<string,string> = { UAE:'🇦🇪', PK:'🇵🇰', UK:'🇬🇧', US:'🇺🇸', KSA:'🇸🇦' };

export default function Pipeline() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'kanban'|'list'>('kanban');
  const [selected, setSelected] = useState<any>(null);
  const [drafting, setDrafting] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/growth/prospects');
    const d = await res.json();
    setProspects(d.prospects || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStage = async (id: string, stage: string) => {
    await fetch('/api/growth/prospects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, stage }) });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, stage } : p));
  };

  const draftOutreach = async (prospect: any) => {
    setDrafting(prospect.id);
    const res = await fetch('/api/growth/outreach', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prospect_id: prospect.id }) });
    const d = await res.json();
    setDrafting(null);
    if (d.ok) { alert(`✅ 3 outreach variants drafted! Check Telegram & Outreach page.`); load(); }
    else alert('Error drafting: ' + JSON.stringify(d));
  };

  const filtered = filter === 'all' ? prospects : prospects.filter(p => p.icp_fit === filter || p.country === filter);
  const byStage = (stage: string) => filtered.filter(p => p.stage === stage);
  const hot = prospects.filter(p => p.icp_fit==='hot').length;
  const warm = prospects.filter(p => p.icp_fit==='warm').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead<br /><em>Pipeline</em></h2>
          <div className="page-sub">{prospects.length} prospects · {hot} hot 🔥 · {warm} warm 🟡</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className={`btn ${view==='kanban'?'btn-primary':'btn-ghost'}`} onClick={()=>setView('kanban')}>⬛ Kanban</button>
          <button className={`btn ${view==='list'?'btn-primary':'btn-ghost'}`} onClick={()=>setView('list')}>☰ List</button>
        </div>
      </div>

      <div className="pill-group" style={{marginBottom:24}}>
        {['all','hot','warm','cold','UAE','PK','UK','US','KSA'].map(f => (
          <button key={f} className={`pill ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{FLAG[f]||''} {f==='all'?'All':f}</button>
        ))}
      </div>

      {loading && <div className="empty"><span className="loading"/></div>}

      {!loading && prospects.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🎯</div>
          <div style={{fontSize:15,color:'var(--ink-dim)',marginBottom:8}}>No prospects yet</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20}}>Run a scout mission to find leads</div>
          <a href="/growth/scout" className="btn btn-primary">🔍 Run Scout Mission</a>
        </div>
      )}

      {!loading && prospects.length > 0 && view === 'kanban' && (
        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:16,alignItems:'start'}}>
          {STAGES.slice(0,6).map(stage => {
            const cards = byStage(stage.id);
            return (
              <div key={stage.id} style={{minWidth:250,flex:'0 0 250px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:stage.color}}>{stage.label}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,background:'var(--bg-3)',padding:'2px 8px',borderRadius:999,color:'var(--ink-faint)'}}>{cards.length}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {cards.map(p => (
                    <div key={p.id} onClick={()=>setSelected(p)} style={{background:'var(--bg-2)',border:'1px solid var(--line)',borderLeft:`4px solid ${FIT_COLORS[p.icp_fit]||'var(--line)'}`,borderRadius:12,padding:14,cursor:'pointer'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <div style={{fontWeight:600,fontSize:13,color:'var(--ink)'}}>{FLAG[p.country]||''} {p.name.slice(0,22)}{p.name.length>22?'…':''}</div>
                        <span style={{fontFamily:'var(--mono)',fontSize:10,fontWeight:700,color:FIT_COLORS[p.icp_fit]||'var(--ink-faint)'}}>{p.qualification_score}/10</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--ink-faint)',marginBottom:8}}>{p.industry} · {p.city}</div>
                      {p.pain_signals?.[0] && <div style={{fontSize:11,color:'var(--accent)',background:'rgba(255,77,46,0.06)',padding:'3px 8px',borderRadius:6,marginBottom:10}}>⚡ {p.pain_signals[0]}</div>}
                      <button className="btn btn-primary" disabled={drafting===p.id} style={{width:'100%',fontSize:11,padding:'7px 12px'}} onClick={e=>{e.stopPropagation();draftOutreach(p);}}>
                        {drafting===p.id ? <><span className="loading"/> Drafting…</> : '✍️ Draft Outreach'}
                      </button>
                    </div>
                  ))}
                  {cards.length===0 && <div style={{padding:'20px 12px',border:'2px dashed var(--line)',borderRadius:10,textAlign:'center',color:'var(--ink-faint)',fontSize:11}}>Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && prospects.length > 0 && view === 'list' && (
        <div style={{background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}>
          {filtered.map((p,i) => (
            <div key={p.id} onClick={()=>setSelected(p)} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:16,padding:'14px 20px',borderBottom:i<filtered.length-1?'1px solid var(--line)':'none',alignItems:'center',cursor:'pointer',background:selected?.id===p.id?'var(--bg-warm)':'transparent'}}>
              <div>
                <div style={{fontWeight:600,color:'var(--ink)',fontSize:14}}>{FLAG[p.country]||''} {p.name}</div>
                <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:2}}>{p.industry} · {p.city}</div>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:11,color:FIT_COLORS[p.icp_fit]||'var(--ink-faint)',fontWeight:700,textTransform:'uppercase'}}>{p.icp_fit==='hot'?'🔥':p.icp_fit==='warm'?'🟡':'🧊'} {p.icp_fit}</div>
              <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-faint)'}}>{p.qualification_score}/10</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',textTransform:'uppercase'}}>{p.stage?.replace('_',' ')}</div>
              <button className="btn btn-ghost" disabled={drafting===p.id} style={{fontSize:11,padding:'6px 10px'}} onClick={e=>{e.stopPropagation();draftOutreach(p);}}>Draft →</button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{position:'fixed',right:0,top:0,bottom:0,width:380,background:'var(--bg-2)',borderLeft:'1px solid var(--line)',padding:28,overflowY:'auto',zIndex:100,boxShadow:'-8px 0 24px rgba(0,0,0,0.08)'}}>
          <button onClick={()=>setSelected(null)} style={{position:'absolute',top:20,right:20,background:'none',border:'none',fontSize:18,cursor:'pointer',color:'var(--ink-faint)'}}>✕</button>
          <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:600,color:'var(--ink)',marginBottom:4,paddingRight:30}}>{FLAG[selected.country]||''} {selected.name}</div>
          <div style={{fontSize:12,color:'var(--ink-faint)',marginBottom:16}}>{selected.industry} · {selected.city}, {selected.country}</div>
          <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:999,background:`${FIT_COLORS[selected.icp_fit]}20`,color:FIT_COLORS[selected.icp_fit]||'var(--ink-faint)',textTransform:'uppercase',display:'inline-block',marginBottom:20}}>
            {selected.icp_fit} · {selected.qualification_score}/10
          </span>
          {selected.score_reason && <div style={{background:'var(--bg-3)',borderRadius:10,padding:14,fontSize:12,lineHeight:1.6,color:'var(--ink-dim)',marginBottom:16}}><strong style={{color:'var(--ink)'}}>Why this score:</strong><br/>{selected.score_reason}</div>}
          {selected.pain_signals?.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8}}>Pain Signals</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {selected.pain_signals.map((s:string,i:number) => <span key={i} style={{fontSize:11,padding:'4px 10px',background:'rgba(255,77,46,0.08)',color:'var(--accent)',borderRadius:999,border:'1px solid rgba(255,77,46,0.2)'}}>{s}</span>)}
              </div>
            </div>
          )}
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8}}>Move Stage</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {STAGES.map(s => <button key={s.id} className={`pill ${selected.stage===s.id?'active':''}`} style={{fontSize:10}} onClick={()=>{updateStage(selected.id,s.id);setSelected({...selected,stage:s.id});}}>{s.label}</button>)}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{textAlign:'center'}}>🌐 Website</a>}
            {selected.instagram_url && <a href={selected.instagram_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{textAlign:'center'}}>📸 Instagram</a>}
            <button className="btn btn-primary" disabled={drafting===selected.id} onClick={()=>draftOutreach(selected)}>{drafting===selected.id?'Drafting…':'✍️ Draft Outreach Messages'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
