import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'

interface MoneyTextProps {
  value: number
  className?: string
  /** Colore por sinal (verde/vermelho) — útil para resultado/saldo. */
  colored?: boolean
  /** Mostra + na frente de positivos. */
  signed?: boolean
  compact?: boolean
}

export function MoneyText({ value, className, colored, signed, compact }: MoneyTextProps) {
  const text = (signed && value > 0 ? '+' : '') + formatBRL(value, { compact })
  return (
    <span
      className={cn(
        'tabular',
        colored && (value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : ''),
        className,
      )}
    >
      {text}
    </span>
  )
}
