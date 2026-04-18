'use client';

import { useEffect, useState } from 'react';

const TEMPLATES = [
  {
    name: 'Daily Trend Hunter',
    trigger: { type: 'schedule', cron: 'daily-research' },
    conditions: [{ type: 'niche_match_min', score: 7 }],
    actions: [
      { type: 'draft_script', variants: 3, format: 'tiktok_hook' },
      { type: 'notify', channel: 'push', message: 'New trend drafts ready' },
    ],
  },
  {
    name: 'Weekly Calendar Builder',
    trigger: { type: 'schedule', cron: 'weekly-calendar' },
    conditions: [],
    actions: [{ type: 'draft_calendar', days: 7 }],
  },
  {
    name: 'Competitor Counter-Strategy',
    trigger: { type: 'competitor_post', handles: ['@hubspot', '@clay_run'] },
    conditions: [{ type: 'niche_match_min', score: 6 }],
    actions: [{ type: 'draft_script', variants: 1, format: 'carousel' }],
  },
  {
    name: 'Viral Post Repurposer',
    trigger: { type: 'post_performance', multiplier: 2 },
    conditions: [],
    actions: [{ type: 'draft_script', variants: 4, format: 'reel' }],
  },
  {
    name: 'Hot Trend Auto-React',
    trigger: { type: 'trend_spike', threshold: 200 },
    conditions: [
      { type: 'niche_match_min', score: 8 },
      { type: 'day_of_week', days: [1, 2, 3, 4, 5] },
    ],
    actions: [
      { type: 'draft_script', variants: 3, format: 'tiktok_hook' },
      { type: 'notify', channel: 'slack' },
    ],
  },
];

function describeTrigger(t: any) {
  switch (t?.type) {
    case 'schedule': return `⏰ ${t.cron}`;
    case 'trend_spike': return `📈 trend +${t.threshold}%`;
    case 'competitor_post': return `👀 ${(t.handles || []).join(', ')}`;
    case 'post_performance': return `🔥 post > ${t.multiplier}x avg`;
    default: return t?.type || 'manual';
  }
}
function describeAction(a: any) {
  switch (a?.type) {
    case 'draft_script': return `✍️ draft ${a.variants}× ${a.format}`;
    case 'draft_calendar': return `📅 calendar ${a.days}d`;
    case 'notify': return `🔔 notify ${a.channel}`;
    case 'auto_post': return `🚀 auto-post ${(a.platforms || []).join(',')}`;
    default: return a?.type;
  }
}

export default function Automation() {
  const [rules, setRules] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'templates' | 'schedule'>('rules');

  const load = async () => {
    setLoading(true);
    const [r, k] = await Promise.all([
      fetch('/api/rules').then(x => x.json()),
      fetch('/api/kill-switch').then(x => x.json()),
    ]);
    setRules(r.rules || []);
    setPaused(!!k.paused);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRule = async (rule: any) => {
    await fetch('/api/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
    });
    load();
  };

  const installTemplate = async (template: any) => {
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...template, enabled: true, run_count: 0 }),
    });
    setTab('rules');
    load();
  };

  const removeRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const togglePause = async () => {
    const res = await fetch('/api/kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: !paused }),
    });
    const data = await res.json();
    setPaused(!!data.paused);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Automation<br /><em>Hub</em></h2>
          <div className="page-sub">{rules.filter(r => r.enabled).length} active rules · {paused ? '⏸ PAUSED' : '▶ running'}</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="kill-switch" onClick={togglePause}>
            {paused ? '▶ Resume All Agents' : '⏸ Pause All Agents'}
          </button>
        </div>
      </div>

      {paused && (
        <div style={{padding:16,background:'rgba(232,50,78,0.08)',border:'1px solid var(--danger)',borderRadius:10,marginBottom:24,fontSize:13,color:'var(--danger)',fontWeight:600}}>
          ⚠ Kill switch is ON — all agents, cron jobs, and rules are paused. No content will be drafted or posted.
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab ${tab==='rules'?'active':''}`} onClick={() => setTab('rules')}>My Rules ({rules.length})</button>
        <button className={`tab ${tab==='templates'?'active':''}`} onClick={() => setTab('templates')}>Templates</button>
        <button className={`tab ${tab==='schedule'?'active':''}`} onClick={() => setTab('schedule')}>Schedule</button>
      </div>

      {loading && <div className="empty"><span className="loading"></span></div>}

      {!loading && tab === 'rules' && (
        <>
          {rules.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div style={{fontSize:14,color:'var(--ink-dim)',marginBottom:8}}>No rules yet</div>
              <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Install a template to get started →</div>
              <button className="btn btn-primary" style={{marginTop:20}} onClick={() => setTab('templates')}>Browse Templates</button>
            </div>
          ) : (
            rules.map((r) => (
              <div key={r.id} className={`rule-card ${r.enabled ? 'enabled' : 'disabled'}`}>
                <div className="rule-header">
                  <div className="rule-name">{r.name}</div>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)'}}>
                      {r.run_count || 0} runs · last: {r.last_run ? new Date(r.last_run).toLocaleString() : 'never'}
                    </div>
                    <button className={`toggle ${r.enabled ? 'on' : ''}`} onClick={() => toggleRule(r)} />
                    <button className="btn btn-ghost" onClick={() => removeRule(r.id)} style={{padding:'6px 10px'}}>✕</button>
                  </div>
                </div>
                <div className="rule-flow">
                  <span className="flow-chip trigger">{describeTrigger(r.trigger)}</span>
                  {(r.conditions || []).length > 0 && (
                    <>
                      <span className="flow-arrow">→</span>
                      {r.conditions.map((c: any, i: number) => (
                        <span key={i} className="flow-chip condition">
                          {c.type === 'niche_match_min' ? `relevance ≥ ${c.score}` :
                           c.type === 'platform_in' ? c.platforms.join('|') :
                           c.type === 'day_of_week' ? 'weekdays only' : c.type}
                        </span>
                      ))}
                    </>
                  )}
                  <span className="flow-arrow">→</span>
                  {(r.actions || []).map((a: any, i: number) => (
                    <span key={i} className="flow-chip action">{describeAction(a)}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!loading && tab === 'templates' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
          {TEMPLATES.map((t) => (
            <div key={t.name} className="panel" style={{padding:24}}>
              <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:19,marginBottom:6,color:'var(--ink)'}}>{t.name}</div>
              <div className="rule-flow" style={{marginTop:12,marginBottom:18}}>
                <span className="flow-chip trigger">{describeTrigger(t.trigger)}</span>
                <span className="flow-arrow">→</span>
                {t.actions.map((a: any, i: number) => (
                  <span key={i} className="flow-chip action">{describeAction(a)}</span>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => installTemplate(t)} style={{width:'100%'}}>+ Install</button>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'schedule' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Scheduled Cron Jobs</div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',letterSpacing:'0.1em'}}>ACTIVE ON VERCEL</div>
          </div>
          <div style={{padding:24}}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                { name: 'Daily Trend Research', cron: '0 6 * * *', desc: 'Every day at 6:00 AM UTC', endpoint: '/api/cron/daily-research' },
                { name: 'Weekly Content Calendar', cron: '0 9 * * 0', desc: 'Every Sunday at 9:00 AM UTC', endpoint: '/api/cron/weekly-calendar' },
                { name: 'Competitor Watch', cron: '0 * * * *', desc: 'Every hour (top of hour)', endpoint: '/api/cron/competitor-watch' },
                { name: 'Performance Check', cron: '30 */2 * * *', desc: 'Every 2 hours at :30', endpoint: '/api/cron/performance-check' },
              ].map((j) => (
                <div key={j.endpoint} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:16,alignItems:'center',padding:'14px 16px',background:'var(--bg-3)',borderRadius:10,border:'1px solid var(--line)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:'var(--ink)'}}>{j.name}</div>
                    <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:2}}>{j.desc}</div>
                  </div>
                  <code style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)',background:'rgba(255,77,46,0.08)',padding:'4px 8px',borderRadius:4}}>{j.cron}</code>
                  <button className="btn btn-ghost" onClick={async () => {
                    const res = await fetch(j.endpoint);
                    alert(res.ok ? 'Fired manually ✓ Check Audit Log' : 'Failed');
                  }}>Run Now</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:24,padding:16,background:'var(--bg-warm)',borderRadius:10,fontSize:12,color:'var(--ink-dim)',lineHeight:1.6}}>
              <strong style={{color:'var(--ink)'}}>How it works:</strong> Vercel Cron hits these endpoints on schedule. Each one looks at your active rules, checks which ones have this cron as their trigger, evaluates conditions, and executes actions. Everything is logged in the Audit Log.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
