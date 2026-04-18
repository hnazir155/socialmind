'use client';

import { useState } from 'react';

export default function Training() {
  const [niche, setNiche] = useState('B2B SaaS marketing');
  const [audience, setAudience] = useState('Founders and marketing leaders at $1M-$50M ARR SaaS companies');
  const [allowedWords, setAllowedWords] = useState('data-driven, systems, scale, framework, leverage');
  const [bannedWords, setBannedWords] = useState('game-changer, synergy, disrupt, utilize, revolutionize');
  const [examples, setExamples] = useState("We didn't 10x revenue with more ads. We rebuilt the funnel.\nYour CAC isn't a marketing problem. It's a positioning problem.\n3 metrics that predict churn 90 days out — save this.");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const save = async () => {
    // Persist via /api/drafts pattern (would be a brand_dna route in production)
    const dna = {
      niche,
      audience,
      tones: ['authority', 'educational'],
      alwaysInclude: allowedWords.split(',').map(w => w.trim()).filter(Boolean),
      neverUse: bannedWords.split(',').map(w => w.trim()).filter(Boolean),
      voiceExamples: examples.split('\n').filter(Boolean),
    };
    localStorage.setItem('socialmind_dna', JSON.stringify(dna));
    setSavedMsg('Brand DNA saved. All agents will now use this profile.');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Training<br /><em>Lab</em></h2>
          <div className="page-sub">Set your brand DNA · all agents will reference it</div>
        </div>
        <button className="btn btn-primary" onClick={save}>Save Brand DNA</button>
      </div>

      {savedMsg && <div style={{padding:14,background:'rgba(110,255,200,0.1)',border:'1px solid var(--accent-3)',borderRadius:6,marginBottom:24,fontSize:13,color:'var(--accent-3)'}}>✓ {savedMsg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Brand Identity</div></div>
          <div className="panel-body">
            <label className="input-label">Niche / Industry</label>
            <input className="input" value={niche} onChange={e => setNiche(e.target.value)} />

            <label className="input-label">Target Audience</label>
            <textarea className="input" value={audience} onChange={e => setAudience(e.target.value)} style={{minHeight:60}} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">Vocabulary Rules</div></div>
          <div className="panel-body">
            <label className="input-label">Words to use (comma-separated)</label>
            <textarea className="input" value={allowedWords} onChange={e => setAllowedWords(e.target.value)} style={{minHeight:60}} />

            <label className="input-label">Words to NEVER use (comma-separated)</label>
            <textarea className="input" value={bannedWords} onChange={e => setBannedWords(e.target.value)} style={{minHeight:60}} />
          </div>
        </div>
      </div>

      <div className="panel" style={{marginTop:24}}>
        <div className="panel-header"><div className="panel-title">Voice Examples</div></div>
        <div className="panel-body">
          <label className="input-label">Past posts that sound like your brand (one per line)</label>
          <textarea className="input" value={examples} onChange={e => setExamples(e.target.value)} style={{minHeight:140}} />
          <div style={{fontSize:11,color:'var(--ink-faint)',fontFamily:'var(--mono)',letterSpacing:'0.05em'}}>
            These few-shot examples are the single most powerful training input. Add 5-10 of your best.
          </div>
        </div>
      </div>
    </div>
  );
}
