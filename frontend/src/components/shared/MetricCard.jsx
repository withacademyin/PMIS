'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  trend = 'neutral',
}: MetricCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </span>

          <Icon
            className="h-3.5 w-3.5 text-slate-300"
            strokeWidth={1.75}
          />
        </div>

        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </span>

          {change !== undefined && (
            <span
              className={`mb-0.5 text-[10px] font-medium ${
                trend === 'up'
                  ? 'text-emerald-600'
                  : trend === 'down'
                    ? 'text-amber-600'
                    : 'text-slate-400'
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricCard;