import React from 'react';
import {
  LayoutDashboard,
  Share2,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  History,
  FileText,
  Terminal,
} from 'lucide-react';

export type ActivePage =
  | 'dashboard'
  | 'social'
  | 'apps'
  | 'findings'
  | 'official'
  | 'scans'
  | 'report';

interface SidebarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  threatCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  threatCount = 0,
}) => {
  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'SOC Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'findings',
      label: 'Threat Findings',
      icon: <ShieldAlert size={18} />,
      badge: threatCount,
    },
    {
      id: 'social',
      label: 'Social Monitoring',
      icon: <Share2 size={18} />,
    },
    {
      id: 'apps',
      label: 'App Store Monitoring',
      icon: <Smartphone size={18} />,
    },
    {
      id: 'official',
      label: 'Protected Assets',
      icon: <ShieldCheck size={18} />,
    },
    {
      id: 'scans',
      label: 'Scan History',
      icon: <History size={18} />,
    },
    {
      id: 'report',
      label: 'Executive Report',
      icon: <FileText size={18} />,
    },
  ];

  return (
    <aside className="sidebar">
      <div
        style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '0.4rem',
            borderRadius: '8px',
            color: 'var(--accent-cyan)',
          }}
        >
          <Terminal size={18} />
        </div>
        <div>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-main)',
            }}
          >
            SOC Console
          </span>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>v1.0 • Live Defense</div>
        </div>
      </div>

      <nav style={{ padding: '1.25rem 0.75rem', flex: 1 }}>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-dim)',
            padding: '0 0.75rem 0.6rem',
          }}
        >
          Navigation
        </div>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '0.35rem' }}>
                <button
                  onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--border-highlight)' : 'transparent',
                    background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                      {item.icon}
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background: 'var(--risk-critical)',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        boxShadow: '0 0 8px rgba(255, 42, 95, 0.5)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer System Specs */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          background: 'rgba(5, 8, 16, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span>Detection Engine:</span>
          <span style={{ color: 'var(--safe-green)', fontWeight: 600 }}>Deterministic v1.0</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Exclusion Whitelist:</span>
          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Zero False+ Mode</span>
        </div>
      </div>
    </aside>
  );
};
