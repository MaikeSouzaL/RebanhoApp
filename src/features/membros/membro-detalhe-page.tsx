import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { useData } from '@/store/data'
import { FORMA_LABEL, TIPO_ENTRADA_LABEL } from '@/data/categorias'
import type { FormaPagamento } from '@/data/types'
import { formatBRL, formatDate, initials } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormaTag } from '@/components/shared/tags'

export function MembroDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { membros, entradas } = useData()
  const membro = membros.find((mem) => mem.id === id)

  const dados = useMemo(() => {
    const mine = entradas
      .filter((e) => e.membroId === id)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
    const total = mine.reduce((a, b) => a + b.valor, 0)
    const anoAtual = new Date().getFullYear()
    const totalAno = mine.filter((e) => e.data.startsWith(String(anoAtual))).reduce((a, b) => a + b.valor, 0)

    // forma preferida
    const formaCount = new Map<FormaPagamento, number>()
    for (const e of mine) formaCount.set(e.forma, (formaCount.get(e.forma) ?? 0) + 1)
    const formaPreferida = [...formaCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    // série mensal (8 meses)
    const serie: { label: string; valor: number }[] = []
    for (let back = 7; back >= 0; back--) {
      const d = subMonths(new Date(), back)
      const key = format(d, 'yyyy-MM')
      const valor = mine.filter((e) => e.competencia === key).reduce((a, b) => a + b.valor, 0)
      serie.push({ label: format(d, 'MMM', { locale: ptBR }), valor })
    }
    const maxSerie = Math.max(...serie.map((s) => s.valor), 1)
    return { mine, total, totalAno, formaPreferida, serie, maxSerie }
  }, [entradas, id])

  if (!membro) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Membro não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/membros')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </button>

      {/* Perfil */}
      <Card className="bg-flame-glow p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 text-lg">
            <AvatarFallback>{initials(membro.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold leading-tight">{membro.nome}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge>{membro.ministerio}</Badge>
              {!membro.ativo && <Badge variant="secondary">Inativo</Badge>}
            </div>
            {membro.telefone && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" /> {membro.telefone}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Totais */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total no ano</p>
          <p className="tabular font-display text-2xl font-semibold text-success">{formatBRL(dados.totalAno, { compact: true })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Forma preferida</p>
          <p className="font-display text-2xl font-semibold">
            {dados.formaPreferida ? FORMA_LABEL[dados.formaPreferida] : '—'}
          </p>
        </Card>
      </div>

      {/* Constância mensal */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold">Constância (8 meses)</h2>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados.serie} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} className="capitalize" />
              <Tooltip
                cursor={{ fill: 'color-mix(in oklab, var(--muted) 60%, transparent)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold capitalize">{label}</p>
                      <p className="tabular">{formatBRL(payload[0]!.value as number)}</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={26}>
                {dados.serie.map((s, i) => (
                  <Cell key={i} fill={s.valor > 0 ? 'var(--chart-1)' : 'var(--muted)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Histórico */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Histórico de contribuições</h2>
        <Card className="divide-y divide-border p-0">
          {dados.mine.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-sm font-semibold">
                  {e.tipo === 'dizimo' ? 'Dízimo' : e.subtipo ?? TIPO_ENTRADA_LABEL[e.tipo]}
                </p>
                <FormaTag forma={e.forma} className="mt-0.5" />
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold text-success">{formatBRL(e.valor)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(e.data)}</p>
              </div>
            </div>
          ))}
          {!dados.mine.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem contribuições registradas.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
