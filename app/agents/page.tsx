'use client';

import { useState, useRef, useEffect } from 'react';

const AGENTS = [
  { id: 'research', name: 'Research', desc: 'Trend hunter' },
  { id: 'strategist', name: 'Strategist', desc: 'Content planner' },
  { id: 'script', name: 'Script', desc: 'Writer & creative' },
  { id: 'publisher', name: 'Publisher', desc: 'Scheduler' },
  { id: 'analytics', name: 'Analytics', desc: 'Performance' },
];

type Msg = { role: 'user' | 'assistant'; content: string };

export default function AgentsPage() {
  const [active, setActive] = useState('research');
  const [history, setHistory] = useState<Record<string, Msg[]>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = history[active] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: input };
    const newHist = [...messages, userMsg];
    setHistory(h => ({ ...h, [active]: newHist }));
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: active, message: input, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const aiMsg: Msg = { role: 'assistant', content: data.result.message };
      setHistory(h => ({ ...h, [active]: [...newHist, aiMsg] }));
    } catch (e: any) {
      setHistory(h => ({ ...h, [active]: [...newHist, { role: 'assistant', content: `⚠ Error: ${e.message}` }] }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Agent<br /><em>Console</em></h2>
          <div className="page-sub">Chat with each agent · powered by GPT-4o</div>
        </div>
      </div>

      <div className="tab-bar">
        {AGENTS.map(a => (
          <button key={a.id} className={`tab ${active === a.id ? 'active' : ''}`} onClick={() => setActive(a.id)}>
            {a.name}
          </button>
        ))}
      </div>

      <div className="console-window">
        <div className="console-header">
          <div className={`agent-icon ${active}`} style={{width:32,height:32,fontSize:14}}>{active[0].toUpperCase()}</div>
          <div>
            <div style={{fontWeight:600}}>{AGENTS.find(a => a.id === active)?.name} Agent</div>
            <div style={{fontSize:11,color:'var(--ink-faint)',fontFamily:'var(--mono)'}}>{AGENTS.find(a => a.id === active)?.desc}</div>
          </div>
          <span className={`agent-status ${loading ? 'working' : 'active'}`} style={{marginLeft:'auto'}}>{loading ? 'Thinking' : 'Active'}</span>
        </div>

        <div className="console-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div style={{textAlign:'center',color:'var(--ink-faint)',padding:40,fontSize:12,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
              Start a conversation with the {active} agent
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'agent'}`}>
              {m.role === 'assistant' && <div className="msg-meta">{active.toUpperCase()} AGENT</div>}
              {m.content}
            </div>
          ))}
          {loading && <div className="msg agent"><span className="loading"></span> thinking...</div>}
        </div>

        <div className="console-input">
          <input
            placeholder={`Ask the ${active} agent...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}
