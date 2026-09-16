import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MetricCard — a single KPI tile for dashboard headers.
 *
 * @param {string}     label        — uppercase metric name ("Postings")
 * @param {string|number} value     — the primary number to display
 * @param {import('lucide-react').LucideIcon} [icon] — lucide icon component
 * @param {string}     [description] — supporting line beneath the value
 * @param {string}     [change]     — delta text ("+1 this month")
 * @param {'up'|'down'} [trend]     — colours the change indicator
 */
export function MetricCard({ label, value, icon: Icon, description, change, trend }) {
  return (
    <Card className="shadow-none border-slate-200 bg-white">
      <CardContent className="p-4">
        {/* Header: label + icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label}
          </span>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
              <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
            </div>
          )}
        </div>

        {/* Primary value */}
        <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
          {value}
        </p>

        {/* Supporting description */}
        {description && (
          <p className="text-xs text-slate-400 mt-1.5">{description}</p>
        )}

        {/* Change indicator */}
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-amber-500" />}
            <span
              className={`text-xs font-medium ${
                trend === 'up'
                  ? 'text-emerald-600'
                  : trend === 'down'
                    ? 'text-amber-600'
                    : 'text-slate-400'
              }`}
            >
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
