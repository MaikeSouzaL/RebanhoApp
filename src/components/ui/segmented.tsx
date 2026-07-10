import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}

/** Controle segmentado (pílulas) — usado em Contas a pagar, período, etc. */
export function Segmented<T extends string>({ value, onChange, options, className }: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'no-scrollbar flex items-center gap-1 overflow-x-auto rounded-2xl bg-secondary p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-all active:scale-[0.98]',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
