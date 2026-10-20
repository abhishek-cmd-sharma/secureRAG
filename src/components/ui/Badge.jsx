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
  const raw = status || 'Active';
  const normalized = raw.toString().toLowerCase().trim();
  const colorClass = getStatusBadgeColor(raw);

  // Capitalize for display (e.g., 'indexed' -> 'Indexed', 'active' -> 'Active')
  const displayText = raw.charAt(0).toUpperCase() + raw.slice(1);

  let dotColor = 'bg-slate-400';
  if (['active', 'indexed', 'ready', 'allowed'].includes(normalized)) {
    dotColor = 'bg-emerald-500';
  } else if (['processing', 'pending', 'uploaded'].includes(normalized)) {
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (['inactive', 'denied', 'failed', 'archived'].includes(normalized)) {
    dotColor = 'bg-rose-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {displayText}
    </span>
  );
}
