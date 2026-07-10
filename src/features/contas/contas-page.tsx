import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Receipt, Repeat } from 'lucide-react'
import { useData } from '@/store/data'
import { contasResumo, isoDayOf, statusConta } from '@/lib/report'
import { CATEGORIA_MAP } from '@/data/categorias'
import type { ContaPagar } from '@/data/types'
import { formatBRL, formatDate } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { CategoryIcon } from '@/components/shared/category-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { FundBadge } from '@/components/shared/tags'
import { EmptyState } from '@/components/shared/empty-state'
import { MoneyText } from '@/components/shared/money'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Filtro = 'aberto' | 'vencido' | 'pago' | 'todos'

export function ContasPage() {
  const { contasPagar, fundos, pagarConta } = useData()
  const [filtro, setFiltro] = useState<Filtro>('aberto')

  const fundoMap = useMemo(() => new Map(fundos.map((f) => [f.id, f])), [fundos])
  const resumo = useMemo(() => contasResumo(contasPagar), [contasPagar])

  const withStatus = useMemo(
    () => contasPagar.map((c) => ({ conta: c, status: statusConta(c) })),
    [contasPagar],
  )

  const counts = {
    aberto: withStatus.filter((c) => c.status !== 'pago').length,
    vencido: withStatus.filter((c) => c.status === 'atrasado').length,
    pago: withStatus.filter((c) => c.status === 'pago').length,
    todos: withStatus.length,
  }

  const lista = useMemo(() => {
    return withStatus
      .filter(({ status }) => {
        if (filtro === 'aberto') return status !== 'pago'
        if (filtro === 'vencido') return status === 'atrasado'
        if (filtro === 'pago') return status === 'pago'
        return true
      })
      .sort((a, b) => (a.conta.vencimento < b.conta.vencimento ? -1 : 1))
  }, [withStatus, filtro])

  function marcarPaga(c: ContaPagar) {
    pagarConta(c.id, isoDayOf(new Date()))
    toast.success(`"${c.descricao}" marcada como paga.`)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Contas a Pagar" subtitle="Compromissos e vencimentos da igreja" />

      {/* Totais */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">Em aberto</p>
          <p className="tabular font-display text-lg font-semibold">{formatBRL(resumo.emAberto, { compact: true })}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="tabular font-display text-lg font-semibold text-destructive">
            {formatBRL(resumo.vencido, { compact: true })}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">Próx. 30d</p>
          <p className="tabular font-display text-lg font-semibold text-[color:var(--warning)]">
            {formatBRL(resumo.prox30, { compact: true })}
          </p>
        </Card>
      </div>

      <Segmented<Filtro>
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: 'aberto', label: 'Em aberto', count: counts.aberto },
          { value: 'vencido', label: 'Vencidas', count: counts.vencido },
          { value: 'pago', label: 'Pagas', count: counts.pago },
          { value: 'todos', label: 'Todas' },
        ]}
      />

      {lista.length ? (
        <div className="space-y-3">
          {lista.map(({ conta, status }) => {
            const meta = CATEGORIA_MAP[conta.categoria]
            return (
              <Card key={conta.id} className={cn('p-4', status === 'atrasado' && 'ring-1 ring-destructive/30')}>
                <div className="flex items-start gap-3">
                  <CategoryIcon categoria={conta.categoria} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {conta.fornecedor ?? meta.label}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} />
                      {conta.recorrencia !== 'unica' && (
                        <Badge variant="secondary">
                          <Repeat />
                          {conta.recorrencia === 'mensal' ? 'Mensal' : 'Anual'}
                        </Badge>
                      )}
                      <FundBadge fundo={fundoMap.get(conta.fundoId)} />
                    </div>
                  </div>
                  <div className="text-right">
                    <MoneyText value={conta.valor} className="font-display text-base font-semibold" />
                    <p
                      className={cn(
                        'mt-0.5 flex items-center justify-end gap-1 text-xs',
                        status === 'atrasado' ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      <CalendarClock className="size-3.5" />
                      {status === 'pago' && conta.pagoEm
                        ? `Pago ${formatDate(conta.pagoEm)}`
                        : formatDate(conta.vencimento)}
                    </p>
                  </div>
                </div>
                {status !== 'pago' && (
                  <Button variant="subtle" size="sm" className="mt-3 w-full" onClick={() => marcarPaga(conta)}>
                    <CheckCircle2 />
                    Marcar como paga
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Receipt} title="Nada aqui" description="Nenhuma conta neste filtro." />
      )}
    </div>
  )
}
