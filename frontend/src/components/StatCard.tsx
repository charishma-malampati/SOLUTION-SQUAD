import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'cyan' | 'red' | 'amber' | 'green' | 'indigo' | 'blue';
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'cyan',
  highlight = false,
}) => {
  const colorMap = {
    cyan: {
      accent: '#00f0ff',
      bg: 'rgba(0, 240, 255, 0.08)',
      border: 'rgba(0, 240, 255, 0.25)',
    },
    red: {
      accent: '#ff2a5f',
      bg: 'rgba(255, 42, 95, 0.1)',
      border: 'rgba(255, 42, 95, 0.3)',
    },
    amber: {
      accent: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    green: {
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    indigo: {
      accent: '#818cf8',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.3)',
    },
    blue: {
      accent: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.3)',
    },
  };

  const c = colorMap[variant];

  return (
    <div
      className={`cyber-card ${highlight ? 'cyber-card-glow' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `3px solid ${c.accent}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '0.25rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
        </div>
        <div
          style={{
            padding: '0.65rem',
            borderRadius: '12px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
