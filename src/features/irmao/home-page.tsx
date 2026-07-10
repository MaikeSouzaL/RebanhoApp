import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, HandCoins, HeartHandshake, ShieldCheck, Sprout } from 'lucide-react'
import { useData } from '@/store/data'
import {
  filterEntradas,
  filterSaidas,
  monthPeriod,
  saidasPorCategoria,
  saldoPorFundo,
  sum,
} from '@/lib/report'
import { CATEGORIA_MAP } from '@/data/categorias'
import { formatBRL, formatPercent, firstName } from '@/lib/format'
import { Emblem } from '@/components/brand/logo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DonutChart } from '@/components/charts/charts'
import { useSession } from '@/store/session'

export function IrmaoHomePage() {
  const { entradas, saidas, fundos } = useData()
  const { user } = useSession()

  const m = useMemo(() => {
    const p = monthPeriod(new Date())
    const ent = sum(filterEntradas(entradas, p))
    const sai = sum(filterSaidas(saidas, p))
    const top = saidasPorCategoria(filterSaidas(saidas, p)).slice(0, 6)
    const campanhas = saldoPorFundo(fundos, entradas, saidas).filter((f) => f.fundo.meta)
    return { ent, sai, saldo: ent - sai, top, campanhas, label: p.label }
  }, [entradas, saidas, fundos])

  const donut = m.top.map((c) => ({
    name: CATEGORIA_MAP[c.categoria].label,
    value: c.total,
    color: CATEGORIA_MAP[c.categoria].cor,
  }))

  return (
    <div className="space-y-5">
      {/* Boas-vindas */}
      <Card className="bg-flame-glow flex items-center gap-4 p-5">
        <Emblem size={56} />
        <div>
          <p className="text-sm text-muted-foreground">Paz do Senhor,</p>
          <h1 className="font-display text-xl font-semibold leading-tight">
            {user ? firstName(user.nome) : 'Irmão'}
          </h1>
        </div>
      </Card>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-accent/50 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-accent-foreground">
          Aqui você acompanha, com <strong>transparência</strong>, tudo o que a igreja recebe e no que
          é aplicado. Prestação de contas é zelo com o que é do Senhor.
        </p>
      </div>

      {/* Resumo do mês (agregado) */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">{m.label}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="tabular font-display text-lg font-semibold text-success">{formatBRL(m.ent, { compact: true })}</p>
            <p className="text-[11px] text-muted-foreground">arrecadado</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="tabular font-display text-lg font-semibold text-[color:var(--chart-3)]">{formatBRL(m.sai, { compact: true })}</p>
            <p className="text-[11px] text-muted-foreground">aplicado</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="tabular font-display text-lg font-semibold">{formatBRL(m.saldo, { compact: true })}</p>
            <p className="text-[11px] text-muted-foreground">em caixa</p>
          </Card>
        </div>
      </div>

      {/* Para onde vai a oferta */}
      {donut.length > 0 && (
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold">Para onde vai a sua oferta</h2>
          <p className="text-xs text-muted-foreground">Aplicação dos recursos no mês</p>
          <div className="mt-2 grid grid-cols-[140px_1fr] items-center gap-3">
            <DonutChart data={donut} height={150} />
            <ul className="space-y-2">
              {donut.slice(0, 5).map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="tabular font-semibold">{formatBRL(d.value, { compact: true })}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/gastos">
            <Button variant="outline" className="mt-4 w-full">
              Ver prestação de contas <ArrowRight />
            </Button>
          </Link>
        </Card>
      )}

      {/* Campanhas */}
      {m.campanhas.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Campanhas</h2>
            <Link to="/fundos" className="text-xs font-semibold text-primary">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {m.campanhas.map((f) => {
              const pct = Math.min(1, f.saldo / (f.fundo.meta ?? 1))
              return (
                <Card key={f.fundo.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <Sprout className="size-4" style={{ color: f.fundo.cor }} />
                      {f.fundo.nome}
                    </span>
                    <span className="tabular text-sm font-semibold">{formatPercent(pct)}</span>
                  </div>
                  <Progress value={pct * 100} indicatorClassName="bg-flame" className="mt-2.5" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatBRL(f.saldo)} de {formatBRL(f.fundo.meta ?? 0)}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA contribuir */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/contribuir">
          <Button variant="flame" size="lg" className="w-full">
            <HandCoins /> Contribuir
          </Button>
        </Link>
        <Link to="/minha">
          <Button variant="outline" size="lg" className="w-full">
            <HeartHandshake /> Minha conta
          </Button>
        </Link>
      </div>
    </div>
  )
}
