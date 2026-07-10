import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  FileText,
  Scale,
  Users,
  Wallet,
} from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import {
  contasResumo,
  contribuintes,
  deltaRatio,
  entradasPorTipo,
  filterEntradas,
  filterSaidas,
  fluxoMensal,
  previousPeriod,
  saldoAcumulado,
  saldoPorFundo,
  saidasPorCategoria,
  statusConta,
  sum,
} from '@/lib/report'
import { CATEGORIA_MAP } from '@/data/categorias'
import { formatBRL, formatDate, formatPercent } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/stat-card'
import { MoneyText } from '@/components/shared/money'
import { PeriodPicker } from '@/components/shared/period-picker'
import { CategoryIcon } from '@/components/shared/category-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { CashflowChart, DonutChart, Sparkline } from '@/components/charts/charts'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { entradas, saidas, contasPagar, fundos } = useData()
  const { user, period } = useSession()

  const m = useMemo(() => {
    const prev = previousPeriod(period)
    const entP = filterEntradas(entradas, period)
    const saiP = filterSaidas(saidas, period)
    const entPrev = filterEntradas(entradas, prev)
    const saiPrev = filterSaidas(saidas, prev)

    const totalEnt = sum(entP)
    const totalSai = sum(saiP)
    const totalEntPrev = sum(entPrev)
    const totalSaiPrev = sum(saiPrev)

    const fluxo = fluxoMensal(entradas, saidas, 6)
    const porTipo = entradasPorTipo(entP)
    const top = saidasPorCategoria(saiP).slice(0, 5)
    const maxTop = top[0]?.total ?? 1
    const contrib = contribuintes(entP)
    const resumo = contasResumo(contasPagar)
    const fundosSaldo = saldoPorFundo(fundos, entradas, saidas)
    const proximas = contasPagar
      .filter((c) => c.status !== 'pago')
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
      .slice(0, 4)

    return {
      totalEnt,
      totalSai,
      resultado: totalEnt - totalSai,
      resultadoPrev: totalEntPrev - totalSaiPrev,
      deltaEnt: deltaRatio(totalEnt, totalEntPrev),
      deltaSai: deltaRatio(totalSai, totalSaiPrev),
      saldoCaixa: saldoAcumulado(entradas, saidas, period.fim),
      sparte: fluxo.map((f) => f.saldo),
      fluxo,
      porTipo,
      top,
      maxTop,
      contrib,
      resumo,
      fundosSaldo,
      proximas,
    }
  }, [entradas, saidas, contasPagar, fundos, period])

  const donutData = [
    { name: 'Dízimos', value: m.porTipo.dizimo, color: 'var(--chart-1)' },
    { name: 'Ofertas', value: m.porTipo.oferta, color: 'var(--chart-2)' },
    { name: 'Outras', value: m.porTipo.outra, color: 'var(--chart-4)' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Paz do Senhor,</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">{user?.nome ?? 'Pastor'}</h1>
        </div>
        <PeriodPicker />
      </div>

      {/* Hero — Saldo em caixa */}
      <Card className="bg-flame-glow overflow-hidden">
        <div className="flex items-start justify-between p-5 pb-0">
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Wallet className="size-4" /> Saldo em caixa
            </span>
            <p className="mt-1 font-display text-[34px] font-semibold leading-none tabular">
              {formatBRL(m.saldoCaixa)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Resultado do período:{' '}
              <MoneyText value={m.resultado} colored signed className="font-semibold" />
            </p>
          </div>
        </div>
        <div className="-mt-2 px-1">
          <Sparkline data={m.sparte.length > 1 ? m.sparte : [0, m.saldoCaixa]} height={56} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Entradas"
          value={formatBRL(m.totalEnt, { compact: true })}
          icon={ArrowUpCircle}
          iconColor="var(--chart-1)"
          delta={m.deltaEnt}
          hint="vs. anterior"
        />
        <StatCard
          label="Saídas"
          value={formatBRL(m.totalSai, { compact: true })}
          icon={ArrowDownCircle}
          iconColor="var(--chart-3)"
          delta={m.deltaSai}
          invertDelta
          hint="vs. anterior"
        />
        <StatCard
          label="Resultado"
          value={<MoneyText value={m.resultado} colored compact />}
          icon={Scale}
          iconColor="var(--chart-2)"
          hint={m.resultado >= 0 ? 'superávit' : 'déficit'}
        />
        <StatCard
          label="Dizimistas"
          value={String(m.contrib.qtdDizimistas)}
          icon={Users}
          iconColor="var(--chart-4)"
          hint={`ticket ${formatBRL(m.contrib.ticketMedio, { compact: true })}`}
        />
      </div>

      {/* Composição de entradas */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Composição das entradas</h2>
          <Link to="/entradas" className="text-xs font-semibold text-primary">
            Ver tudo
          </Link>
        </div>
        {donutData.length ? (
          <div className="mt-2 grid grid-cols-[150px_1fr] items-center gap-3">
            <DonutChart
              data={donutData}
              centerValue={formatBRL(m.totalEnt, { compact: true })}
              centerLabel="total"
            />
            <ul className="space-y-2.5">
              {donutData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 text-sm text-muted-foreground">{d.name}</span>
                  <span className="tabular text-sm font-semibold">{formatBRL(d.value, { compact: true })}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem entradas no período.</p>
        )}
      </Card>

      {/* Fluxo de caixa */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold">Fluxo de caixa</h2>
        <p className="text-xs text-muted-foreground">Últimos 6 meses · entradas, saídas e saldo</p>
        <div className="mt-3">
          <CashflowChart data={m.fluxo} />
        </div>
      </Card>

      {/* Top categorias de despesa */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Para onde vai o dinheiro</h2>
          <Link to="/saidas" className="text-xs font-semibold text-primary">
            Ver gastos
          </Link>
        </div>
        <ul className="mt-3 space-y-3">
          {m.top.map((c) => {
            const meta = CATEGORIA_MAP[c.categoria]
            return (
              <li key={c.categoria} className="flex items-center gap-3">
                <CategoryIcon categoria={c.categoria} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{meta.label}</span>
                    <span className="tabular text-sm font-semibold">{formatBRL(c.total, { compact: true })}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.total / m.maxTop) * 100}%`, backgroundColor: meta.cor }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
          {!m.top.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">Sem gastos no período.</p>
          )}
        </ul>
      </Card>

      {/* Contas a pagar próximas */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Contas a pagar</h2>
          <Link to="/contas" className="flex items-center text-xs font-semibold text-primary">
            Ver todas <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          <span className="rounded-lg bg-secondary px-2 py-1 font-semibold">
            Em aberto <span className="tabular">{formatBRL(m.resumo.emAberto, { compact: true })}</span>
          </span>
          {m.resumo.vencido > 0 && (
            <span className="rounded-lg bg-destructive/12 px-2 py-1 font-semibold text-destructive">
              Vencido <span className="tabular">{formatBRL(m.resumo.vencido, { compact: true })}</span>
            </span>
          )}
        </div>
        <ul className="mt-3 divide-y divide-border">
          {m.proximas.map((c) => {
            const st = statusConta(c)
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon categoria={c.categoria} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.descricao}</p>
                  <p className={cn('text-xs', st === 'atrasado' ? 'text-destructive' : 'text-muted-foreground')}>
                    Vence {formatDate(c.vencimento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold">{formatBRL(c.valor)}</p>
                  <StatusBadge status={st} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Fundos designados */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Fundos designados</h2>
          <Link to="/fundos" className="text-xs font-semibold text-primary">
            Detalhes
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {m.fundosSaldo.map((f) => (
            <Card key={f.fundo.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: f.fundo.cor }} />
                <span className="text-sm font-semibold">{f.fundo.nome}</span>
              </div>
              <p className="mt-2 tabular font-display text-lg font-semibold">{formatBRL(f.saldo, { compact: true })}</p>
              {f.fundo.meta ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatPercent(Math.min(1, f.saldo / f.fundo.meta))} da meta
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-muted-foreground">saldo atual</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* CTA relatório */}
      <Link to="/relatorios">
        <Button size="lg" variant="flame" className="w-full">
          <FileText />
          Gerar relatório de prestação de contas
        </Button>
      </Link>
    </div>
  )
}
