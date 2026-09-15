import * as React from 'react';
import { cn } from '@/lib/utils';

export function Alert({ className, variant = 'default', children, ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-3 text-sm flex items-start gap-2.5',
        variant === 'destructive'
          ? 'border-rose-200 bg-rose-50 text-rose-900 [&>svg]:text-rose-600'
          : 'border-slate-200 bg-white text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, children, ...props }) {
  return (
    <h5 className={cn('font-medium leading-none tracking-tight text-sm', className)} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children, ...props }) {
  return (
    <div className={cn('text-xs leading-relaxed mt-1 text-slate-600', className)} {...props}>
      {children}
    </div>
  );
}

export function AlertAction({ className, children, ...props }) {
  return (
    <div className={cn('ml-auto shrink-0', className)} {...props}>
      {children}
    </div>
  );
}
