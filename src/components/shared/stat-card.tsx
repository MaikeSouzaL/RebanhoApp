import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { formatDelta } from '@/lib/format'

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  iconColor?: string
  /** Variação relativa (ex.: 0.12 = +12%). */
  delta?: number
  /** Quando true, um delta negativo é BOM (ex.: despesas caindo). */
  invertDelta?: boolean
  hint?: string
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  delta,
  invertDelta,
  hint,
  className,
}: StatCardProps) {
  const good = delta == null ? false : invertDelta ? delta < 0 : delta > 0
  const bad = delta == null ? false : invertDelta ? delta > 0 : delta < 0
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-warm', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `color-mix(in oklab, ${iconColor ?? 'var(--primary)'} 14%, transparent)`,
              color: iconColor ?? 'var(--primary)',
            }}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular">{value}</div>
      <div className="mt-1 flex items-center gap-1.5">
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold',
              good && 'text-success',
              bad && 'text-destructive',
              !good && !bad && 'text-muted-foreground',
            )}
          >
            {delta > 0 ? <ArrowUpRight className="size-3.5" /> : delta < 0 ? <ArrowDownRight className="size-3.5" /> : null}
            {formatDelta(delta)}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  )
}
