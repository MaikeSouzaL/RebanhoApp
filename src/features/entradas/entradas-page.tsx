import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Inbox, Search } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { filterEntradas, sum, type EntradaFiltro } from '@/lib/report'
import { TIPO_ENTRADA_LABEL } from '@/data/categorias'
import type { Entrada, TipoEntrada } from '@/data/types'
import { formatBRL, formatDate, initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodPicker } from '@/components/shared/period-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { FormaTag, FundBadge } from '@/components/shared/tags'
import { exportCSV } from '@/lib/csv'
import { cn } from '@/lib/utils'

export function EntradasPage() {
  const { entradas, membros, fundos } = useData()
  const { period } = useSession()
  const [tab, setTab] = useState<TipoEntrada>('dizimo')
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const membroMap = useMemo(() => new Map(membros.map((mem) => [mem.id, mem])), [membros])
  const fundoMap = useMemo(() => new Map(fundos.map((f) => [f.id, f])), [fundos])

  const lista = useMemo(() => {
    const filtro: EntradaFiltro = { tipo: tab }
    let l = filterEntradas(entradas, period, filtro)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      l = l.filter((e) => {
        const nome = e.membroId ? membroMap.get(e.membroId)?.nome ?? '' : ''
        return (nome + ' ' + (e.subtipo ?? '')).toLowerCase().includes(q)
      })
    }
    return l
  }, [entradas, period, tab, busca, membroMap])

  const total = sum(lista)
  const ticket = lista.length ? total / lista.length : 0

  function nome(e: Entrada) {
    if (e.tipo === 'dizimo') return e.membroId ? membroMap.get(e.membroId)?.nome ?? 'Membro' : 'Dízimo'
    return e.subtipo ?? TIPO_ENTRADA_LABEL[e.tipo]
  }

  function exportar() {
    exportCSV(
      `entradas-${tab}-${period.inicio}.csv`,
      ['Data', 'Tipo', 'Descrição', 'Membro', 'Forma', 'Fundo', 'Valor'],
      lista.map((e) => [
        formatDate(e.data),
        TIPO_ENTRADA_LABEL[e.tipo],
        e.subtipo ?? '',
        e.membroId ? membroMap.get(e.membroId)?.nome ?? '' : 'Anônimo',
        e.forma,
        fundoMap.get(e.fundoId)?.nome ?? '',
        e.valor,
      ]),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dízimos & Ofertas"
        subtitle="Quem está contribuindo e quanto entra"
        action={<PeriodPicker />}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TipoEntrada)}>
        <TabsList>
          <TabsTrigger value="dizimo">Dízimos</TabsTrigger>
          <TabsTrigger value="oferta">Ofertas</TabsTrigger>
          <TabsTrigger value="outra">Outras</TabsTrigger>
        </TabsList>

        {(['dizimo', 'oferta', 'outra'] as TipoEntrada[]).map((t) => (
          <TabsContent key={t} value={t} className="space-y-4">
            {/* Resumo */}
            <Card className="grid grid-cols-3 divide-x divide-border p-0">
              <Resumo label="Total" value={formatBRL(total, { compact: true })} strong />
              <Resumo label="Lançamentos" value={String(lista.length)} />
              <Resumo label="Ticket médio" value={formatBRL(ticket, { compact: true })} />
            </Card>

            {/* Busca + export */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou tipo…"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={exportar} aria-label="Exportar CSV">
                <Download />
              </Button>
            </div>

            {/* Lista */}
            {lista.length ? (
              <Card className="divide-y divide-border p-0">
                {lista.map((e) => {
                  const clickable = !!e.membroId
                  const membro = e.membroId ? membroMap.get(e.membroId) : undefined
                  return (
                    <button
                      key={e.id}
                      disabled={!clickable}
                      onClick={() => membro && navigate(`/membros/${membro.id}`)}
                      className={cn(
                        'flex w-full items-center gap-3 p-3.5 text-left',
                        clickable && 'active:bg-accent',
                      )}
                    >
                      <Avatar className="size-10">
                        <AvatarFallback>
                          {membro ? initials(membro.nome) : e.tipo === 'oferta' ? '♥' : '◎'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{nome(e)}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <FormaTag forma={e.forma} />
                          <span className="text-muted-foreground/50">·</span>
                          <FundBadge fundo={fundoMap.get(e.fundoId)} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-sm font-semibold text-success">{formatBRL(e.valor)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.data)}</p>
                      </div>
                    </button>
                  )
                })}
              </Card>
            ) : (
              <EmptyState icon={Inbox} title="Nada por aqui" description="Não há lançamentos neste período." />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function Resumo({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="p-3.5 text-center">
      <p className={cn('tabular font-display font-semibold', strong ? 'text-lg text-success' : 'text-lg')}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
