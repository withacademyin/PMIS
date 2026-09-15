import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({ value = 0, className, ...props }) {
  const safeValue = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export default Progress;
