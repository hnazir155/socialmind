'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { section: 'Workspace', items: [
    { href: '/', label: 'Dashboard', icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
    { href: '/calendar', label: 'Calendar', icon: 'M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 10h18' },
    { href: '/approval', label: 'Approval Queue', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h11', badge: '0' },
    { href: '/studio', label: 'Script Studio', icon: 'M23 7l-7 5 7 5V7zM1 5h15v14H1z' },
  ]},
  { section: 'Intelligence', items: [
    { href: '/agents', label: 'Agent Console', icon: 'M12 8V4H8M4 8h16v12H4z' },
    { href: '/automation', label: 'Automation Hub', icon: 'M6 9a3 3 0 116-0M18 21a3 3 0 11-6 0M9 6h6a3 3 0 013 3v6' },
    { href: '/training', label: 'Training Lab', icon: 'M22 10v6M2 10l10-5 10 5-10 5z' },
    { href: '/analytics', label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
  ]},
  { section: 'Setup', items: [
    { href: '/settings/connections', label: 'Connections', icon: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Social<em>Mind</em></h1>
        <span className="tag">v0.1 · Multi-Agent Cmd</span>
      </div>
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
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">AM</div>
          <div>
            <div className="name">Acme Marketing</div>
            <div className="role">Pro Workspace</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
