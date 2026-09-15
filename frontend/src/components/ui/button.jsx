import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  variant: {
    default: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 focus-visible:ring-indigo-500',
    destructive: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 focus-visible:ring-rose-500',
    outline: 'border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
    secondary: 'bg-slate-100 text-slate-800 shadow-xs hover:bg-slate-200 focus-visible:ring-slate-400',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
    link: 'text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500',
    subtle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200',
  },
  size: {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 rounded-md px-3 text-xs font-medium',
    lg: 'h-10 rounded-md px-6 text-sm font-medium',
    icon: 'h-8 w-8 p-0',
  },
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          buttonVariants.variant[variant] || buttonVariants.variant.default,
          buttonVariants.size[size] || buttonVariants.size.default,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
