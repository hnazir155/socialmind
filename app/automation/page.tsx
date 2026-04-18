'use client';

const TEMPLATES = [
  { id: 'trend', name: 'Trend Hunter', desc: 'Spot rising trends → draft 3 variants → notify you' },
  { id: 'repurpose', name: 'Viral Repurposer', desc: 'Top post → atomize into 4 platforms automatically' },
  { id: 'competitor', name: 'Competitor Watch', desc: 'Tracked competitor posts → analyze → counter-strategy' },
  { id: 'calendar', name: 'Weekly Auto-Calendar', desc: 'Friday 5pm → generate next week → Sunday review' },
  { id: 'sound', name: 'Sound Scout', desc: 'New TikTok sound matches niche → draft script' },
  { id: 'lead', name: 'Lead Sniper', desc: 'Buying-intent comment → notify + draft reply' },
];

export default function Automation() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Automation<br /><em>Hub</em></h2>
          <div className="page-sub">Workflow templates · backend wiring coming soon</div>
        </div>
      </div>

      <div style={{padding:14,background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:6,marginBottom:24,fontSize:12,color:'var(--ink-dim)'}}>
        ⓘ Automation execution requires a job runner (Vercel Cron or Inngest). Templates below are configured but won't fire until the runner is wired up.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {TEMPLATES.map(t => (
          <div key={t.id} style={{background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:8,padding:20}}>
            <div style={{width:36,height:36,borderRadius:6,background:'var(--bg-3)',border:'1px solid var(--line-2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--display)',fontStyle:'italic',fontSize:18,color:'var(--accent)',marginBottom:14}}>{t.name[0]}</div>
            <div style={{fontFamily:'var(--display)',fontWeight:400,fontSize:17,marginBottom:6}}>{t.name}</div>
            <div style={{fontSize:12,color:'var(--ink-dim)',lineHeight:1.5,marginBottom:14}}>{t.desc}</div>
            <button className="btn btn-ghost" style={{width:'100%'}}>Install Template</button>
          </div>
        ))}
      </div>
    </div>
  );
}
