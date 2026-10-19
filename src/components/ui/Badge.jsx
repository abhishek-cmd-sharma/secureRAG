import React from 'react';
import { getAccessLevelBadgeColor, getRoleBadgeColor, getStatusBadgeColor } from '../../utils/formatters';

export function AccessBadge({ level }) {
  const colorClass = getAccessLevelBadgeColor(level);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {level}
    </span>
  );
}

export function RoleBadge({ role }) {
  const colorClass = getRoleBadgeColor(role);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {role}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colorClass = getStatusBadgeColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' || status === 'Indexed' || status === 'Allowed' ? 'bg-emerald-500' : status === 'Processing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
      {status}
    </span>
  );
}
