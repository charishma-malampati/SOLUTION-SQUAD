import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || '').toLowerCase();
  let badgeClass = 'badge-status-new';
  let label = norm.replace('_', ' ').toUpperCase();

  switch (norm) {
    case 'unreviewed':
      badgeClass = 'badge-status-new';
      label = 'UNREVIEWED';
      break;
    case 'reviewed':
      badgeClass = 'badge-status-review';
      label = 'REVIEWED';
      break;
    case 'false_positive':
      badgeClass = 'badge-status-resolved';
      label = 'FALSE POSITIVE';
      break;
    case 'escalated':
      badgeClass = 'badge-status-confirmed';
      label = 'ESCALATED / TAKEDOWN';
      break;
    default:
      badgeClass = 'badge-status-review';
      label = norm.toUpperCase();
      break;
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
};
