import type { CategoriaDespesaId, CategoriaDespesaMeta, TipoEntrada, FormaPagamento } from './types'

export const CATEGORIAS_DESPESA: CategoriaDespesaMeta[] = [
  { id: 'aluguel', label: 'Aluguel do templo', icon: 'Building2', cor: 'var(--chart-2)' },
  { id: 'energia', label: 'Energia elétrica', icon: 'Zap', cor: 'var(--chart-4)' },
  { id: 'agua', label: 'Água', icon: 'Droplets', cor: 'var(--chart-2)' },
  { id: 'internet', label: 'Internet e telefone', icon: 'Wifi', cor: 'var(--chart-2)' },
  { id: 'som', label: 'Som e mídia', icon: 'Music4', cor: 'var(--chart-5)' },
  { id: 'manutencao', label: 'Manutenção e reparos', icon: 'Wrench', cor: 'var(--chart-3)' },
  { id: 'materiais', label: 'Materiais e limpeza', icon: 'SprayCan', cor: 'var(--chart-3)' },
  { id: 'prebenda', label: 'Prebenda pastoral', icon: 'HandHeart', cor: 'var(--chart-1)' },
  { id: 'missoes', label: 'Missões', icon: 'Globe', cor: 'var(--chart-1)' },
  { id: 'assistencia', label: 'Assistência social', icon: 'HeartHandshake', cor: 'var(--chart-5)' },
  { id: 'eventos', label: 'Eventos e congressos', icon: 'CalendarDays', cor: 'var(--chart-3)' },
  { id: 'transporte', label: 'Transporte', icon: 'Bus', cor: 'var(--chart-2)' },
  { id: 'outros', label: 'Outros', icon: 'Package', cor: 'var(--muted-foreground)' },
]

export const CATEGORIA_MAP: Record<CategoriaDespesaId, CategoriaDespesaMeta> = Object.fromEntries(
  CATEGORIAS_DESPESA.map((c) => [c.id, c]),
) as Record<CategoriaDespesaId, CategoriaDespesaMeta>

export const TIPO_ENTRADA_LABEL: Record<TipoEntrada, string> = {
  dizimo: 'Dízimo',
  oferta: 'Oferta',
  outra: 'Outra entrada',
}

export const FORMA_LABEL: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  transferencia: 'Transferência',
}

export const FORMA_ICON: Record<FormaPagamento, string> = {
  pix: 'QrCode',
  dinheiro: 'Banknote',
  cartao: 'CreditCard',
  transferencia: 'ArrowLeftRight',
}
