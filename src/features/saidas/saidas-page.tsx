import { useMemo, useState } from 'react'
import { Download, Paperclip, Receipt, Search } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { filterSaidas, saidasPorCategoria, sum } from '@/lib/report'
import { CATEGORIAS_DESPESA, CATEGORIA_MAP } from '@/data/categorias'
import type { CategoriaDespesaId } from '@/data/types'
import { formatBRL, formatDate } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodPicker } from '@/components/shared/period-picker'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryIcon } from '@/components/shared/category-icon'
import { DonutChart } from '@/components/charts/charts'
import { EmptyState } from '@/components/shared/empty-state'
import { FormaTag, FundBadge } from '@/components/shared/tags'
import { exportCSV } from '@/lib/csv'

export function SaidasPage() {
  const { saidas, fundos } = useData()
  const { period } = useSession()
  const [cat, setCat] = useState<'all' | CategoriaDespesaId>('all')
  const [busca, setBusca] = useState('')

  const fundoMap = useMemo(() => new Map(fundos.map((f) => [f.id, f])), [fundos])

  const lista = useMemo(
    () => filterSaidas(saidas, period, { categoria: cat === 'all' ? undefined : cat, busca }),
    [saidas, period, cat, busca],
  )
  const porCat = useMemo(() => saidasPorCategoria(filterSaidas(saidas, period)), [saidas, period])
  const donut = porCat.slice(0, 6).map((c) => ({
    name: CATEGORIA_MAP[c.categoria].label,
    value: c.total,
    color: CATEGORIA_MAP[c.categoria].cor,
  }))

  function exportar() {
    exportCSV(
      `saidas-${period.inicio}.csv`,
      ['Data', 'Categoria', 'Descrição', 'Fornecedor', 'Forma', 'Fundo', 'Valor'],
      lista.map((s) => [
        formatDate(s.data),
        CATEGORIA_MAP[s.categoria].label,
        s.descricao,
        s.fornecedor ?? '',
        s.forma,
        fundoMap.get(s.fundoId)?.nome ?? '',
        s.valor,
      ]),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Saídas & Gastos" subtitle="Tudo o que a igreja pagou" action={<PeriodPicker />} />

      {/* Resumo por categoria */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total gasto no período</p>
            <p className="tabular font-display text-2xl font-semibold text-[color:var(--chart-3)]">
              {formatBRL(sum(filterSaidas(saidas, period)))}
            </p>
          </div>
        </div>
        {donut.length > 0 && (
          <div className="mt-2 grid grid-cols-[140px_1fr] items-center gap-3">
            <DonutChart data={donut} height={150} />
            <ul className="min-w-0 space-y-2">
              {donut.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="tabular shrink-0 font-semibold">{formatBRL(d.value, { compact: true })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <SelectTrigger className="w-[46%]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIAS_DESPESA.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" className="pl-9" />
        </div>
        <Button variant="outline" size="icon" onClick={exportar} aria-label="Exportar CSV">
          <Download />
        </Button>
      </div>

      {/* Lista */}
      {lista.length ? (
        <Card className="divide-y divide-border p-0">
          {lista.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3.5">
              <CategoryIcon categoria={s.categoria} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.descricao}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  {s.fornecedor && <span className="truncate text-xs text-muted-foreground">{s.fornecedor}</span>}
                  <FundBadge fundo={fundoMap.get(s.fundoId)} />
                  {s.comprovante && <Paperclip className="size-3 text-muted-foreground" />}
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold text-[color:var(--chart-3)]">− {formatBRL(s.valor)}</p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <FormaTag forma={s.forma} />
                  <span className="text-xs text-muted-foreground">{formatDate(s.data)}</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={Receipt} title="Sem gastos" description="Nenhuma saída neste filtro." />
      )}
    </div>
  )
}
