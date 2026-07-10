import { cn } from '@/lib/utils'
import { FORMA_ICON, FORMA_LABEL } from '@/data/categorias'
import type { Fundo, FormaPagamento } from '@/data/types'
import { Icon } from './icon'

export function FundBadge({ fundo, className }: { fundo?: Fundo; className?: string }) {
  if (!fundo) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground', className)}>
      <span className="size-2 rounded-full" style={{ backgroundColor: fundo.cor }} />
      {fundo.nome}
    </span>
  )
}

export function FormaTag({ forma, className }: { forma: FormaPagamento; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-muted-foreground', className)}>
      <Icon name={FORMA_ICON[forma]} className="size-3.5" />
      {FORMA_LABEL[forma]}
    </span>
  )
}
