import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarClock,
  Church,
  HandCoins,
  HeartHandshake,
  ListChecks,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import {
  contasResumo,
  filterEntradas,
  filterSaidas,
  monthPeriod,
  statusConta,
  sum,
} from '@/lib/report'
import { formatBRL, formatDate } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { MoneyText } from '@/components/shared/money'
import { CategoryIcon } from '@/components/shared/category-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'

const ACOES: { to: string; label: string; icon: LucideIcon; color: string }[] = [
  { to: '/novo/dizimo', label: 'Dízimo', icon: HandCoins, color: 'var(--chart-1)' },
  { to: '/novo/oferta', label: 'Oferta', icon: HeartHandshake, color: 'var(--chart-2)' },
  { to: '/novo/despesa', label: 'Despesa', icon: ShoppingCart, color: 'var(--chart-3)' },
  { to: '/novo/conta', label: 'Conta a pagar', icon: Receipt, color: 'var(--warning)' },
]

export function TesoureiroHomePage() {
  const { entradas, saidas, contasPagar } = useData()
  const { user } = useSession()
  const navigate = useNavigate()

  const m = useMemo(() => {
    const p = monthPeriod(new Date())
    const ent = sum(filterEntradas(entradas, p))
    const sai = sum(filterSaidas(saidas, p))
    const resumo = contasResumo(contasPagar)
    const pendencias = contasPagar
      .filter((c) => statusConta(c) !== 'pago')
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
      .slice(0, 3)
    const recentes = [
      ...filterEntradas(entradas, p).slice(0, 6).map((e) => ({ kind: 'entrada' as const, item: e })),
      ...filterSaidas(saidas, p).slice(0, 6).map((s) => ({ kind: 'saida' as const, item: s })),
    ]
      .sort((a, b) => (a.item.data < b.item.data ? 1 : -1))
      .slice(0, 5)
    return { ent, sai, saldo: ent - sai, resumo, pendencias, recentes, label: p.label }
  }, [entradas, saidas, contasPagar])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Paz do Senhor,</p>
        <h1 className="font-display text-2xl font-semibold leading-tight">{user?.nome}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Tesouraria · {m.label}</p>
      </div>

      {/* Resumo do mês */}
      <Card className="bg-brand-mesh p-5">
        <p className="text-sm text-muted-foreground">Movimento do mês</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="tabular font-display text-lg font-semibold text-success">
              {formatBRL(m.ent, { compact: true })}
            </p>
            <p className="text-[11px] text-muted-foreground">entradas</p>
          </div>
          <div>
            <p className="tabular font-display text-lg font-semibold text-[color:var(--chart-3)]">
              {formatBRL(m.sai, { compact: true })}
            </p>
            <p className="text-[11px] text-muted-foreground">saídas</p>
          </div>
          <div>
            <MoneyText value={m.saldo} colored compact className="font-display text-lg font-semibold" />
            <p className="text-[11px] text-muted-foreground">saldo</p>
          </div>
        </div>
      </Card>

      {/* Ações rápidas */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Registrar</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACOES.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-warm active:scale-[0.98]"
            >
              <span
                className="flex size-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in oklab, ${a.color} 16%, transparent)`, color: a.color }}
              >
                <a.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
        <Link
          to="/culto"
          className="bg-flame-glow mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-warm active:scale-[0.99]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-flame text-white">
            <Church className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Fechamento de culto</span>
            <span className="block text-xs text-muted-foreground">Conte a oferta e registre de uma vez</span>
          </span>
        </Link>
      </div>

      {/* Pendências */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Pendências</h2>
          <Link to="/contas" className="text-xs font-semibold text-primary">
            Ver contas
          </Link>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          <span className="rounded-lg bg-secondary px-2 py-1 font-semibold">
            Em aberto {formatBRL(m.resumo.emAberto, { compact: true })}
          </span>
          {m.resumo.countVencido > 0 && (
            <span className="rounded-lg bg-destructive/12 px-2 py-1 font-semibold text-destructive">
              {m.resumo.countVencido} vencida(s)
            </span>
          )}
        </div>
        <ul className="mt-3 divide-y divide-border">
          {m.pendencias.map((c) => {
            const st = statusConta(c)
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
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
              </li>
            )
          })}
          {!m.pendencias.length && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma conta em aberto. 🎉</p>
          )}
        </ul>
      </Card>

      {/* Últimos lançamentos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Últimos lançamentos</h2>
          <Link to="/lancamentos" className="flex items-center gap-1 text-xs font-semibold text-primary">
            <ListChecks className="size-4" /> Ver todos
          </Link>
        </div>
        <Card className="divide-y divide-border p-0">
          {m.recentes.map((r) => (
            <button
              key={r.item.id}
              onClick={() => navigate('/lancamentos')}
              className="flex w-full items-center gap-3 p-3.5 text-left active:bg-accent"
            >
              {r.kind === 'entrada' ? (
                <span className="flex size-10 items-center justify-center rounded-xl bg-success/12 text-success">
                  <ArrowUpRight className="size-5" />
                </span>
              ) : (
                <CategoryIcon categoria={r.item.categoria} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {r.kind === 'entrada'
                    ? r.item.tipo === 'dizimo'
                      ? 'Dízimo'
                      : r.item.subtipo ?? 'Oferta'
                    : r.item.descricao}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(r.item.data)}</p>
              </div>
              <p className={cn('tabular text-sm font-semibold', r.kind === 'entrada' ? 'text-success' : 'text-[color:var(--chart-3)]')}>
                {r.kind === 'entrada' ? '' : '− '}
                {formatBRL(r.item.valor)}
              </p>
            </button>
          ))}
          {!m.recentes.length && (
            <p className="p-5 text-center text-sm text-muted-foreground">Nenhum lançamento este mês.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
