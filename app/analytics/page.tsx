'use client';

export default function Analytics() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics<br /><em>&amp; Insights</em></h2>
          <div className="page-sub">Connect platforms to populate metrics</div>
        </div>
      </div>

      <div className="empty">
        <div className="empty-icon">⌘</div>
        <div style={{fontSize:14,color:'var(--ink-dim)',marginBottom:8}}>Analytics will appear once posts go live</div>
        <div style={{fontSize:11,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase'}}>The Analytics Agent pulls from each platform's Insights API after publishing</div>
      </div>
    </div>
  );
}
