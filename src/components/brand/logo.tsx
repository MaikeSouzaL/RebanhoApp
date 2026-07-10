import { cn } from '@/lib/utils'

/** Emblema real da igreja (foto do Bom Pastor). */
export function Emblem({ className, size = 64 }: { className?: string; size?: number }) {
  return (
    <img
      src="/emblema.png"
      alt="O Rebanho de Jesus Cristo"
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Marca compacta em SVG — anel verde, chama pentecostal e cajado. */
export function Logomark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Rebanho"
    >
      <defs>
        <linearGradient id="lm-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--flame-to)" />
          <stop offset="0.55" stopColor="var(--flame-via)" />
          <stop offset="1" stopColor="var(--flame-from)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="var(--card)" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--brand-green)" strokeWidth="3.4" />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="var(--brand-green)" strokeWidth="1.3" opacity="0.7" />
      <path
        d="M32 15c5.5 5.4 9 9.8 9 15.2a9 9 0 1 1-18 0c0-3.3 1.7-6 3.8-8.4-.4 2.6.5 4.3 1.8 5.2-.3-4.6 1.2-9 3.4-12z"
        fill="url(#lm-flame)"
      />
      <path
        d="M29 47c0-8.6 0-15 0-19.4a4.4 4.4 0 1 1 8.8 0"
        fill="none"
        stroke="var(--leather)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Nome da igreja (wordmark). */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Logomark size={compact ? 30 : 36} />
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold tracking-tight">O Rebanho</p>
        {!compact && (
          <p className="text-[11px] font-medium text-muted-foreground">de Jesus Cristo</p>
        )}
      </div>
    </div>
  )
}
