'use client';

import { Badge } from '@/components/ui/badge';

const STATUS_MAP = {
  APPLIED: { label: 'Applied', cls: 'text-slate-500 border-slate-200 bg-white' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'border-amber-200 text-amber-600 bg-amber-50/50' },
  SHORTLISTED: { label: 'Shortlisted', cls: 'text-slate-700 border-slate-300 bg-slate-50' },
  INTERVIEW_SCHEDULED: { label: 'Interview', cls: 'text-slate-800 border-slate-400 bg-slate-50' },
  ACCEPTED: { label: 'Accepted', cls: 'text-emerald-700 border-emerald-200 bg-emerald-50/50' },
  REJECTED: { label: 'Rejected', cls: 'text-slate-400 border-slate-200 bg-white line-through' },
};

export function StatusBadge({ status }) {
  const d = STATUS_MAP[status] || { label: status, cls: 'text-slate-500 border-slate-200' };
  return (
    <Badge variant="outline" className={`font-mono text-[10px] uppercase shadow-none ${d.cls}`}>
      {d.label}
    </Badge>
  );
}

export default StatusBadge;
