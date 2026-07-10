import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Target } from 'lucide-react'
import { useData } from '@/store/data'
import { saldoPorFundo } from '@/lib/report'
import { formatBRL, formatPercent } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function FundosPage() {
  const { fundos, entradas, saidas } = useData()
  const dados = useMemo(() => saldoPorFundo(fundos, entradas, saidas), [fundos, entradas, saidas])

  return (
    <div className="space-y-4">
      <PageHeader title="Fundos designados" subtitle="Como cada oferta é aplicada" />

      <div className="space-y-3">
        {dados.map((f) => {
          const pct = f.fundo.meta ? Math.min(1, f.saldo / f.fundo.meta) : null
          return (
            <Card key={f.fundo.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full" style={{ background: f.fundo.cor }} />
                  <div>
                    <h2 className="font-display text-lg font-semibold leading-tight">{f.fundo.nome}</h2>
                    <p className="text-xs text-muted-foreground">{f.fundo.descricao}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular font-display text-xl font-semibold">{formatBRL(f.saldo, { compact: true })}</p>
                  <p className="text-[11px] text-muted-foreground">saldo</p>
                </div>
              </div>

              {pct != null && f.fundo.meta && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Target className="size-3.5" /> Meta {formatBRL(f.fundo.meta, { compact: true })}
                    </span>
                    <span className="tabular font-semibold">{formatPercent(pct)}</span>
                  </div>
                  <Progress value={pct * 100} indicatorClassName="bg-flame" />
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-secondary p-3">
                  <ArrowUpCircle className="size-5 text-[color:var(--chart-1)]" />
                  <div>
                    <p className="tabular text-sm font-semibold">{formatBRL(f.entradas, { compact: true })}</p>
                    <p className="text-[11px] text-muted-foreground">entradas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-secondary p-3">
                  <ArrowDownCircle className="size-5 text-[color:var(--chart-3)]" />
                  <div>
                    <p className="tabular text-sm font-semibold">{formatBRL(f.saidas, { compact: true })}</p>
                    <p className="text-[11px] text-muted-foreground">saídas</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
