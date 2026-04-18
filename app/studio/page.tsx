'use client';

import { useState } from 'react';

const FORMATS = [
  { id: 'veo3', label: 'Veo 3 Video' },
  { id: 'nano_banana', label: 'Nano Banana Image' },
  { id: 'tiktok_hook', label: 'TikTok Hook' },
  { id: 'short', label: 'YouTube Short' },
  { id: 'reel', label: 'IG Reel Script' },
  { id: 'carousel', label: 'Carousel' },
];

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube'];
const TONES = ['authority', 'playful', 'provocative', 'educational'];

export default function Studio() {
  const [format, setFormat] = useState('veo3');
  const [topic, setTopic] = useState('How AI agents are replacing entire marketing teams at SaaS startups');
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'tiktok']);
  const [tones, setTones] = useState<string[]>(['authority']);
  const [duration, setDuration] = useState(8);
  const [visualStyle, setVisualStyle] = useState('cinematic editorial');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const togglePill = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const generate = async () => {
    setLoading(true); setError(null); setOutput(null); setSavedMsg(null);
    try {
      const res = await fetch('/api/agents/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platform: platforms[0] || 'instagram',
          format,
          tone: tones,
          duration,
          visualStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendToQueue = async () => {
    if (!output) return;
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          format,
          platform: platforms[0],
          status: 'draft',
          content: output,
        }),
      });
      if (res.ok) setSavedMsg('Saved to Approval Queue ✓');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Script<br /><em>Studio</em></h2>
          <div className="page-sub">Veo 3 · Nano Banana · TikTok hooks · Reel scripts</div>
        </div>
      </div>

      <div className="tab-bar">
        {FORMATS.map(f => (
          <button key={f.id} className={`tab ${format === f.id ? 'active' : ''}`} onClick={() => setFormat(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:1,background:'var(--line)',border:'1px solid var(--line)',borderRadius:8,overflow:'hidden',minHeight:600}}>
        <div style={{background:'var(--bg-2)',padding:24}}>
          <label className="input-label">Topic / Idea</label>
          <textarea className="input" value={topic} onChange={e => setTopic(e.target.value)} />

          <label className="input-label">Platforms</label>
          <div className="pill-group">
            {PLATFORMS.map(p => (
              <button key={p} className={`pill ${platforms.includes(p) ? 'active' : ''}`} onClick={() => togglePill(platforms, setPlatforms, p)}>
                {p}
              </button>
            ))}
          </div>

          <label className="input-label">Tone</label>
          <div className="pill-group">
            {TONES.map(t => (
              <button key={t} className={`pill ${tones.includes(t) ? 'active' : ''}`} onClick={() => togglePill(tones, setTones, t)}>
                {t}
              </button>
            ))}
          </div>

          <label className="input-label">Duration (seconds)</label>
          <input type="number" className="input" value={duration} onChange={e => setDuration(Number(e.target.value))} />

          <label className="input-label">Visual Style</label>
          <select className="input" value={visualStyle} onChange={e => setVisualStyle(e.target.value)}>
            <option>cinematic editorial</option>
            <option>documentary handheld</option>
            <option>vertical vlog</option>
            <option>3D animation</option>
            <option>brutalist text-heavy</option>
          </select>

          <button className="btn btn-primary" style={{width:'100%',padding:12,marginTop:8}} onClick={generate} disabled={loading}>
            {loading ? <><span className="loading"></span> Generating...</> : '⚡ Generate'}
          </button>

          {error && <div style={{marginTop:16,padding:12,background:'rgba(255,77,109,0.1)',border:'1px solid var(--danger)',borderRadius:4,fontSize:12,color:'var(--danger)'}}>{error}</div>}
        </div>

        <div style={{background:'var(--bg-2)',padding:32,overflow:'auto'}}>
          {!output && !loading && (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div style={{fontSize:14,color:'var(--ink-dim)',marginBottom:4}}>Ready to generate</div>
              <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Configure on the left, click generate</div>
            </div>
          )}

          {loading && (
            <div className="empty">
              <span className="loading" style={{width:24,height:24}}></span>
              <div style={{marginTop:16,fontSize:12,color:'var(--ink-faint)',fontFamily:'var(--mono)',letterSpacing:'0.15em',textTransform:'uppercase'}}>Script Agent thinking...</div>
            </div>
          )}

          {output && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:4}}>Generated · {new Date().toLocaleTimeString()}</div>
                  <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:400}}>{format.replace('_', ' ').toUpperCase()} — Output</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-ghost" onClick={generate}>Regenerate</button>
                  <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(output, null, 2))}>Copy JSON</button>
                  <button className="btn btn-primary" onClick={sendToQueue}>Send to Queue</button>
                </div>
              </div>

              {savedMsg && <div style={{padding:12,background:'rgba(110,255,200,0.1)',border:'1px solid var(--accent-3)',borderRadius:4,fontSize:12,color:'var(--accent-3)',marginBottom:16}}>{savedMsg}</div>}

              <div className="script-output">
                <div className="scene">// MAIN OUTPUT</div>
                {'\n\n'}{output.main_output}{'\n\n'}

                <div className="scene">// HOOK VARIATIONS</div>{'\n'}
                {(output.hook_variations || []).map((h: string, i: number) => `→ ${h}`).join('\n')}{'\n\n'}

                <div className="scene">// CAPTION</div>{'\n'}
                {output.caption}{'\n\n'}

                <div className="scene">// HASHTAGS</div>{'\n'}
                <strong>Primary:</strong> {(output.hashtags?.primary || []).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}{'\n'}
                <strong>Niche:</strong> {(output.hashtags?.niche || []).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}{'\n'}
                <strong>Long-tail:</strong> {(output.hashtags?.longtail || []).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}{'\n\n'}

                <div className="scene">// AGENT NOTES</div>{'\n'}
                Predicted reach: {output.predicted_reach}{'\n'}
                Best post time: {output.best_post_time}{'\n'}
                Notes: {output.agent_notes}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
