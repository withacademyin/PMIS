'use client';

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="py-16 text-center">
      {Icon && <Icon className="mx-auto h-5 w-5 text-slate-200 mb-2" />}
      <p className="text-xs font-medium text-slate-400">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default EmptyState;
