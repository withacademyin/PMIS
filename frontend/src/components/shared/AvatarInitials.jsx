'use client';

export function AvatarInitials({ name, size = 'w-7 h-7', className = '' }) {
  const initials = (name || '??').slice(0, 2).toUpperCase();
  return (
    <div className={`${size} rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center ${className}`}>
      <span className="text-[10px] font-semibold text-slate-500">{initials}</span>
    </div>
  );
}

export default AvatarInitials;
