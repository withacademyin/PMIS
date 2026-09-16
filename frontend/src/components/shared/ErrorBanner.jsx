'use client';

import { AlertCircle } from 'lucide-react';

export function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{error}</span>
      </div>
      <button onClick={onDismiss} className="font-medium text-red-600 hover:underline">
        Dismiss
      </button>
    </div>
  );
}

export default ErrorBanner;
