// Helper utilities for formatters, labels, and color mappings

export function getAccessLevelBadgeColor(level) {
  switch (level) {
    case 'Public':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Internal':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Confidential':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Restricted':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getRoleBadgeColor(role) {
  switch (role) {
    case 'Admin':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Manager':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Employee':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusBadgeColor(status) {
  const normalized = (status || '').toString().toLowerCase().trim();
  switch (normalized) {
    case 'active':
    case 'indexed':
    case 'ready':
    case 'allowed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'processing':
    case 'pending':
    case 'uploaded':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'inactive':
    case 'denied':
    case 'failed':
    case 'archived':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function canAccessDocument(userRole, docAccessLevel) {
  if (userRole === 'Admin') return true;
  if (userRole === 'Manager') {
    return ['Public', 'Internal', 'Confidential'].includes(docAccessLevel);
  }
  if (userRole === 'Employee') {
    return ['Public', 'Internal'].includes(docAccessLevel);
  }
  return false;
}
