'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  { section: 'Workspace', items: [
    { href: '/', label: 'Dashboard', icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
    { href: '/calendar', label: 'Calendar', icon: 'M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 10h18' },
    { href: '/approval', label: 'Approval Queue', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h11' },
    { href: '/studio', label: 'Script Studio', icon: 'M23 7l-7 5 7 5V7zM1 5h15v14H1z' },
  ]},
  { section: 'Growth', items: [
    { href: '/growth/pipeline', label: 'Lead Pipeline', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { href: '/growth/scout', label: 'Prospect Scout', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { href: '/growth/outreach', label: 'Outreach Queue', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ]},
  { section: 'Intelligence', items: [
    { href: '/agents', label: 'Agent Console', icon: 'M12 8V4H8M4 8h16v12H4z' },
    { href: '/automation', label: 'Automation Hub', icon: 'M6 9a3 3 0 116-0M18 21a3 3 0 11-6 0M9 6h6a3 3 0 013 3v6' },
    { href: '/audit', label: 'Audit Log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/training', label: 'Training Lab', icon: 'M22 10v6M2 10l10-5 10 5-10 5z' },
    { href: '/analytics', label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
  ]},
  { section: 'Setup', items: [
    { href: '/settings/connections', label: 'Connections', icon: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sidebarContent = (
    <>
      <div className="brand">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Social<em>Mind</em></h1>
          {/* Close button — mobile only */}
          <button
            className="sidebar-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >✕</button>
        </div>
        <span className="tag">v0.1 · Multi-Agent Cmd</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {NAV.map((sec) => (
          <div key={sec.section} className="nav-section">
            <div className="nav-label">{sec.section}</div>
            {sec.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">AM</div>
          <div>
            <div className="name">Acme Marketing</div>
            <div className="role">Pro Workspace</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE TOPBAR — hamburger + brand */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div className="mobile-brand">Social<em>Mind</em></div>
      </div>

      {/* OVERLAY — tapping outside closes sidebar on mobile */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* SIDEBAR — always visible on desktop, slide-in on mobile */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
