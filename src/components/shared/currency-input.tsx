import { formatNumberBR } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  autoFocus?: boolean
  id?: string
}

/**
 * Entrada monetária em BRL. Digita-se apenas números; o valor é construído
 * em centavos (ex.: "1","5","0","0" → R$ 15,00).
 */
export function CurrencyInput({ value, onChange, className, autoFocus, id }: CurrencyInputProps) {
  const display = value ? formatNumberBR(value) : ''

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const cents = digits ? parseInt(digits, 10) : 0
    onChange(cents / 100)
  }

  return (
    <div
      className={cn(
        'flex h-14 items-center rounded-xl border border-input bg-card px-4 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35',
        className,
      )}
    >
      <span className="mr-1.5 font-display text-xl font-semibold text-muted-foreground">R$</span>
      <input
        id={id}
        inputMode="decimal"
        autoFocus={autoFocus}
        value={display}
        onChange={handle}
        placeholder="0,00"
        className="tabular w-full bg-transparent font-display text-2xl font-semibold outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  )
}
