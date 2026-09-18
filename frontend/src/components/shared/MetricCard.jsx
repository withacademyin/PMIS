import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_VARIANTS = {
  default: {
    card: 'bg-white border-slate-200 hover:border-slate-300',
    iconBg: 'bg-slate-50 border-slate-100/80',
    iconColor: 'text-slate-500',
    label: 'text-slate-400',
    description: 'text-slate-400',
  },
  blue: {
    card: 'bg-blue-50/70 border-blue-100/90 hover:border-blue-200',
    iconBg: 'bg-blue-100/80 border-blue-200/50',
    iconColor: 'text-blue-600',
    label: 'text-blue-600/80 font-medium',
    description: 'text-slate-500',
  },
  'subtle-blue': {
    card: 'bg-blue-50/70 border-blue-100/90 hover:border-blue-200',
    iconBg: 'bg-blue-100/80 border-blue-200/50',
    iconColor: 'text-blue-600',
    label: 'text-blue-600/80 font-medium',
    description: 'text-slate-500',
  },
  sky: {
    card: 'bg-sky-50/70 border-sky-100/90 hover:border-sky-200',
    iconBg: 'bg-sky-100/80 border-sky-200/50',
    iconColor: 'text-sky-600',
    label: 'text-sky-600/80 font-medium',
    description: 'text-slate-500',
  },
  'light-blue': {
    card: 'bg-sky-50/70 border-sky-100/90 hover:border-sky-200',
    iconBg: 'bg-sky-100/80 border-sky-200/50',
    iconColor: 'text-sky-600',
    label: 'text-sky-600/80 font-medium',
    description: 'text-slate-500',
  },
  green: {
    card: 'bg-emerald-50/70 border-emerald-100/90 hover:border-emerald-200',
    iconBg: 'bg-emerald-100/80 border-emerald-200/50',
    iconColor: 'text-emerald-600',
    label: 'text-emerald-700/80 font-medium',
    description: 'text-slate-500',
  },
  'light-green': {
    card: 'bg-emerald-50/70 border-emerald-100/90 hover:border-emerald-200',
    iconBg: 'bg-emerald-100/80 border-emerald-200/50',
    iconColor: 'text-emerald-600',
    label: 'text-emerald-700/80 font-medium',
    description: 'text-slate-500',
  },
  pink: {
    card: 'bg-pink-50/70 border-pink-100/90 hover:border-pink-200',
    iconBg: 'bg-pink-100/80 border-pink-200/50',
    iconColor: 'text-pink-600',
    label: 'text-pink-600/80 font-medium',
    description: 'text-slate-500',
  },
  'light-pink': {
    card: 'bg-pink-50/70 border-pink-100/90 hover:border-pink-200',
    iconBg: 'bg-pink-100/80 border-pink-200/50',
    iconColor: 'text-pink-600',
    label: 'text-pink-600/80 font-medium',
    description: 'text-slate-500',
  },
  purple: {
    card: 'bg-purple-50/70 border-purple-100/90 hover:border-purple-200',
    iconBg: 'bg-purple-100/80 border-purple-200/50',
    iconColor: 'text-purple-600',
    label: 'text-purple-600/80 font-medium',
    description: 'text-slate-500',
  },
  amber: {
    card: 'bg-amber-50/70 border-amber-100/90 hover:border-amber-200',
    iconBg: 'bg-amber-100/80 border-amber-200/50',
    iconColor: 'text-amber-600',
    label: 'text-amber-600/80 font-medium',
    description: 'text-slate-500',
  },
};

/**
 * MetricCard — a single KPI tile for dashboard headers.
 *
 * @param {string}     label        — uppercase metric name ("Postings")
 * @param {string|number} value     — the primary number to display
 * @param {import('lucide-react').LucideIcon} [icon] — lucide icon component
 * @param {string}     [description] — supporting line beneath the value
 * @param {string}     [change]     — delta text ("+1 this month")
 * @param {'up'|'down'} [trend]     — colours the change indicator
 * @param {string}     [color]      — color variant: 'blue' | 'sky' | 'green' | 'pink' | 'purple' | 'amber' | 'default'
 * @param {string}     [className]  — additional CSS classes for the card
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  change,
  trend,
  color = 'default',
  className,
}) {
  const styles = COLOR_VARIANTS[color] || COLOR_VARIANTS.default;

  return (
    <Card className={cn('shadow-none transition-all duration-200', styles.card, className)}>
      <CardContent className="p-4">
        {/* Header: label + icon */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn('text-[11px] font-medium uppercase tracking-wider', styles.label)}>
            {label}
          </span>
          {Icon && (
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border transition-colors', styles.iconBg)}>
              <Icon className={cn('h-4 w-4', styles.iconColor)} strokeWidth={1.75} />
            </div>
          )}
        </div>

        {/* Primary value */}
        <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
          {value}
        </p>

        {/* Supporting description */}
        {description && (
          <p className={cn('text-xs mt-1.5', styles.description || 'text-slate-400')}>{description}</p>
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
