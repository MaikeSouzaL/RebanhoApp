import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Church, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/store/data'
import { isoDayOf } from '@/lib/report'
import { formatBRL } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/shared/currency-input'
import { cn } from '@/lib/utils'

// Cédulas e moedas do Real.
const CEDULAS = [200, 100, 50, 20, 10, 5, 2]
const MOEDAS = [1, 0.5, 0.25, 0.1, 0.05]

export function CultoPage() {
  const { addEntrada } = useData()
  const navigate = useNavigate()
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [pix, setPix] = useState(0)
  const [data, setData] = useState(isoDayOf(new Date()))

  const set = (v: number, delta: number) =>
    setQtd((q) => ({ ...q, [v]: Math.max(0, (q[v] ?? 0) + delta) }))

  const dinheiro = useMemo(
    () => [...CEDULAS, ...MOEDAS].reduce((acc, v) => acc + v * (qtd[v] ?? 0), 0),
    [qtd],
  )
  const total = dinheiro + pix

  function fechar() {
    if (total <= 0) return toast.error('Informe os valores do culto.')
    if (dinheiro > 0)
      addEntrada({ tipo: 'oferta', subtipo: 'Culto', valor: dinheiro, data, forma: 'dinheiro', fundoId: 'f-geral', membroId: null })
    if (pix > 0)
      addEntrada({ tipo: 'oferta', subtipo: 'Culto', valor: pix, data, forma: 'pix', fundoId: 'f-geral', membroId: null })
    toast.success(`Culto fechado: ${formatBRL(total)}`)
    navigate('/lancamentos')
  }

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title="Fechamento de culto" subtitle="Conte a oferta e registre de uma vez" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data do culto</Label>
          <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ofertas via Pix/cartão</Label>
          <CurrencyInput value={pix} onChange={setPix} className="h-11 text-base [&_input]:text-base [&_span]:text-base" />
        </div>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-display text-base font-semibold">Contagem do dinheiro</h2>
        <div className="space-y-1.5">
          {[...CEDULAS, ...MOEDAS].map((v, i) => {
            const n = qtd[v] ?? 0
            const isCoin = i >= CEDULAS.length
            return (
              <div key={v} className="flex items-center gap-3 rounded-xl px-1 py-1">
                <span className={cn('w-16 shrink-0 text-sm font-semibold', isCoin ? 'text-muted-foreground' : '')}>
                  {formatBRL(v)}
                </span>
                <button onClick={() => set(v, -1)} className="flex size-9 items-center justify-center rounded-lg border border-border active:scale-95 disabled:opacity-40" disabled={n === 0} aria-label="menos">
                  <Minus className="size-4" />
                </button>
                <span className="tabular w-8 text-center text-base font-semibold">{n}</span>
                <button onClick={() => set(v, 1)} className="flex size-9 items-center justify-center rounded-lg border border-border active:scale-95" aria-label="mais">
                  <Plus className="size-4" />
                </button>
                <span className="tabular ml-auto text-sm font-semibold text-muted-foreground">
                  {n > 0 ? formatBRL(v * n) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Barra de total fixa */}
      <div className="pb-safe fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-4">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-warm">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              Dinheiro {formatBRL(dinheiro, { compact: true })} · Pix {formatBRL(pix, { compact: true })}
            </p>
            <p className="tabular font-display text-xl font-semibold text-success">{formatBRL(total)}</p>
          </div>
          <Button variant="flame" onClick={fechar}>
            <Church /> Fechar culto
          </Button>
        </div>
      </div>
    </div>
  )
}
