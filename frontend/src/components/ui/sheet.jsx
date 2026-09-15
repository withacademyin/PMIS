'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

function Sheet({ open, onOpenChange, children }) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && onOpenChange) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in-0"
        onClick={() => onOpenChange && onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Container to handle focus and children */}
      {children}
    </div>
  );
}

function SheetContent({ className, children, side = 'right', onClose, ...props }) {
  const sideClasses = {
    top: 'inset-x-0 top-0 border-b animate-in slide-in-from-top-full',
    bottom: 'inset-x-0 bottom-0 border-t animate-in slide-in-from-bottom-full',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm animate-in slide-in-from-left-full',
    right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm animate-in slide-in-from-right-full',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed z-50 gap-4 bg-white p-6 shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
        sideClasses[side],
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 text-slate-400 opacity-70 transition-opacity hover:opacity-100 hover:text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-400 cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="h-full overflow-y-auto pr-2 pb-6">
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-left mb-6', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-auto pt-6', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-slate-500 leading-relaxed', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
