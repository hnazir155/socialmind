'use client';

import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/calendar': 'Calendar',
  '/approval': 'Approval Queue',
  '/studio': 'Script Studio',
  '/agents': 'Agent Console',
  '/automation': 'Automation Hub',
  '/audit': 'Audit Log',
  '/training': 'Training Lab',
  '/analytics': 'Analytics',
  '/settings/connections': 'Connections',
};

export default function Topbar() {
  const pathname = usePathname();
  const label = LABELS[pathname] || 'SocialMind';
  return (
    <div className="topbar">
      <div className="breadcrumb">
        Workspace / <span>{label}</span>
      </div>
      <div className="topbar-right">
        <div className="status-pill"><span className="status-dot"></span>5 Agents Online</div>
      </div>
    </div>
  );
}
