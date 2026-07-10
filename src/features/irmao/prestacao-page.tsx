import { useMemo } from 'react'
import { CalendarClock, Receipt } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { filterSaidas, statusConta, sum } from '@/lib/report'
import { CATEGORIA_MAP } from '@/data/categorias'
import { formatBRL, formatDate } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodPicker } from '@/components/shared/period-picker'
import { Card } from '@/components/ui/card'
import { CategoryIcon } from '@/components/shared/category-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'

export function PrestacaoPage() {
  const { saidas, contasPagar } = useData()
  const { period } = useSession()

  const gastos = useMemo(() => filterSaidas(saidas, period), [saidas, period])
  const total = sum(gastos)
  const abertas = useMemo(
    () =>
      contasPagar
        .filter((c) => statusConta(c) !== 'pago')
        .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1)),
    [contasPagar],
  )
  const totalAberto = sum(abertas)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prestação de contas"
        subtitle="No que a igreja aplicou os recursos"
        action={<PeriodPicker />}
      />

      <Card className="bg-brand-mesh p-5 text-center">
        <p className="text-sm text-muted-foreground">Total aplicado no período</p>
        <p className="tabular font-display text-3xl font-semibold text-[color:var(--chart-3)]">{formatBRL(total)}</p>
      </Card>

      {/* Contas a pagar em aberto */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">
          A igreja precisa pagar
          <span className="ml-2 tabular text-sm font-semibold text-muted-foreground">
            {formatBRL(totalAberto, { compact: true })}
          </span>
        </h2>
        {abertas.length ? (
          <Card className="divide-y divide-border p-0">
            {abertas.map((c) => {
              const st = statusConta(c)
              return (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <CategoryIcon categoria={c.categoria} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.descricao}</p>
                    <p className={cn('flex items-center gap-1 text-xs', st === 'atrasado' ? 'text-destructive' : 'text-muted-foreground')}>
                      <CalendarClock className="size-3.5" /> {formatDate(c.vencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{formatBRL(c.valor)}</p>
                    <StatusBadge status={st} />
                  </div>
                </div>
              )
            })}
          </Card>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhuma conta em aberto. 🙌
          </p>
        )}
      </div>

      {/* Gastos do período */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Gastos do período</h2>
        {gastos.length ? (
          <Card className="divide-y divide-border p-0">
            {gastos.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3.5">
                <CategoryIcon categoria={s.categoria} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIA_MAP[s.categoria].label}
                    {s.fornecedor ? ` · ${s.fornecedor}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold text-[color:var(--chart-3)]">{formatBRL(s.valor)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.data)}</p>
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState icon={Receipt} title="Sem gastos" description="Nenhum gasto neste período." />
        )}
      </div>
    </div>
  )
}
