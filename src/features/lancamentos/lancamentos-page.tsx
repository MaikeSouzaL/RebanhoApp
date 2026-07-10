import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, ListChecks, Pencil, Search, Trash2 } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { filterEntradas, filterSaidas } from '@/lib/report'
import { TIPO_ENTRADA_LABEL } from '@/data/categorias'
import type { Entrada, Saida } from '@/data/types'
import { formatBRL, formatDate, initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodPicker } from '@/components/shared/period-picker'
import { Segmented } from '@/components/ui/segmented'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/shared/category-icon'
import { FormaTag } from '@/components/shared/tags'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { exportCSV } from '@/lib/csv'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Row =
  | { kind: 'entrada'; data: string; item: Entrada }
  | { kind: 'saida'; data: string; item: Saida }

type Filtro = 'todos' | 'entradas' | 'saidas'

export function LancamentosPage() {
  const { entradas, saidas, membros, removeEntrada, removeSaida } = useData()
  const { period } = useSession()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busca, setBusca] = useState('')
  const [aRemover, setARemover] = useState<Row | null>(null)

  const membroMap = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros])

  const rows = useMemo(() => {
    const ent: Row[] = filterEntradas(entradas, period).map((e) => ({ kind: 'entrada', data: e.data, item: e }))
    const sai: Row[] = filterSaidas(saidas, period).map((s) => ({ kind: 'saida', data: s.data, item: s }))
    let all: Row[] = filtro === 'entradas' ? ent : filtro === 'saidas' ? sai : [...ent, ...sai]
    if (busca.trim()) {
      const q = busca.toLowerCase()
      all = all.filter((r) => titulo(r).toLowerCase().includes(q))
    }
    return all.sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [entradas, saidas, period, filtro, busca])

  function titulo(r: Row): string {
    if (r.kind === 'entrada') {
      if (r.item.tipo === 'dizimo')
        return r.item.membroId ? membroMap.get(r.item.membroId)?.nome ?? 'Dízimo' : 'Dízimo'
      return r.item.subtipo ?? TIPO_ENTRADA_LABEL[r.item.tipo]
    }
    return r.item.descricao
  }

  function confirmarRemover() {
    if (!aRemover) return
    if (aRemover.kind === 'entrada') removeEntrada(aRemover.item.id)
    else removeSaida(aRemover.item.id)
    toast.success('Lançamento excluído.')
    setARemover(null)
  }

  function exportar() {
    exportCSV(
      `lancamentos-${period.inicio}.csv`,
      ['Data', 'Tipo', 'Descrição', 'Valor'],
      rows.map((r) => [
        formatDate(r.data),
        r.kind === 'entrada' ? 'Entrada' : 'Saída',
        titulo(r),
        r.kind === 'entrada' ? r.item.valor : -r.item.valor,
      ]),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Lançamentos" subtitle="Tudo o que entrou e saiu" action={<PeriodPicker />} />

      <Segmented<Filtro>
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: 'todos', label: 'Todos' },
          { value: 'entradas', label: 'Entradas' },
          { value: 'saidas', label: 'Saídas' },
        ]}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" className="pl-9" />
        </div>
        <Button variant="outline" size="icon" onClick={exportar} aria-label="Exportar CSV">
          <Download />
        </Button>
      </div>

      {rows.length ? (
        <Card className="divide-y divide-border p-0">
          {rows.map((r) => (
            <div key={r.item.id} className="flex items-center gap-2.5 p-3.5">
              {r.kind === 'entrada' ? (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
                  {r.item.membroId ? (
                    <span className="text-[11px] font-bold">{initials(membroMap.get(r.item.membroId)?.nome ?? '?')}</span>
                  ) : (
                    <ArrowUpRight className="size-5" />
                  )}
                </span>
              ) : (
                <CategoryIcon categoria={r.item.categoria} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{titulo(r)}</p>
                <FormaTag forma={r.item.forma} className="mt-0.5" />
              </div>
              <div className="shrink-0 pl-1 text-right">
                <p
                  className={cn(
                    'tabular text-sm font-semibold',
                    r.kind === 'entrada' ? 'text-success' : 'text-[color:var(--chart-3)]',
                  )}
                >
                  {r.kind === 'entrada' ? '' : '− '}
                  {formatBRL(r.item.valor)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(r.data)}</p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  onClick={() => navigate(r.kind === 'entrada' ? `/editar/entrada/${r.item.id}` : `/editar/despesa/${r.item.id}`)}
                  className="rounded-lg p-1.5 text-muted-foreground active:bg-accent"
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setARemover(r)}
                  className="rounded-lg p-1.5 text-muted-foreground active:bg-accent"
                  aria-label="Excluir"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={ListChecks} title="Sem lançamentos" description="Nada neste filtro/período." />
      )}

      <Dialog open={!!aRemover} onOpenChange={(v) => !v && setARemover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento?</DialogTitle>
            <DialogDescription>
              {aRemover && (
                <>
                  {titulo(aRemover)} —{' '}
                  <span className="tabular font-semibold">{formatBRL(aRemover.item.valor)}</span>. Esta ação não pode ser desfeita.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmarRemover}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
