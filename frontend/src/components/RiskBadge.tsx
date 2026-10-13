import React from 'react';

interface RiskBadgeProps {
  tier: string;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, score }) => {
  const norm = (tier || '').toLowerCase();
  let badgeClass = 'badge-low';
  let label = norm.toUpperCase();

  if (norm === 'critical') {
    badgeClass = 'badge-critical';
    label = 'CRITICAL';
  } else if (norm === 'high') {
    badgeClass = 'badge-high';
    label = 'HIGH';
  } else if (norm === 'medium') {
    badgeClass = 'badge-medium';
    label = 'MEDIUM';
  } else if (norm === 'low') {
    badgeClass = 'badge-low';
    label = 'LOW';
  } else if (norm === 'safe') {
    badgeClass = 'badge-safe';
    label = 'SAFE / EXCLUDED';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {label}
      {score !== undefined && (
        <span style={{ opacity: 0.85, fontWeight: 500, marginLeft: 2 }}>
          ({Math.round(score)})
        </span>
      )}
    </span>
  );
};
