import { useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Download, HeartHandshake, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { shareText } from '@/lib/share'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { TIPO_ENTRADA_LABEL } from '@/data/categorias'
import { formatBRL, formatDate, initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { FormaTag } from '@/components/shared/tags'
import { ReciboDocument, type ReciboData } from './recibo-document'

export function MinhaContribuicaoPage() {
  const { entradas, membros, config } = useData()
  const { user } = useSession()
  const reciboRef = useRef<HTMLDivElement>(null)

  const membro = user?.membroId ? membros.find((m) => m.id === user.membroId) : undefined
  const ano = new Date().getFullYear()

  const dados = useMemo(() => {
    const mine = entradas
      .filter((e) => e.membroId === user?.membroId)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
    const noAno = mine.filter((e) => e.data.startsWith(String(ano)))
    const totalAno = noAno.reduce((a, b) => a + b.valor, 0)
    const totalDizimo = noAno.filter((e) => e.tipo === 'dizimo').reduce((a, b) => a + b.valor, 0)
    const totalOferta = noAno.filter((e) => e.tipo !== 'dizimo').reduce((a, b) => a + b.valor, 0)

    const meses = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(ano, i, 1)
      const key = format(d, 'yyyy-MM')
      const valor = mine.filter((e) => e.competencia === key).reduce((a, b) => a + b.valor, 0)
      return { label: format(d, 'MMMM', { locale: ptBR }), short: format(d, 'MMM', { locale: ptBR }), valor }
    })
    const chart = meses.filter((_, i) => i >= new Date().getMonth() - 7 && i <= new Date().getMonth())
    return { mine, totalAno, totalDizimo, totalOferta, meses, chart }
  }, [entradas, user, ano])

  const recibo: ReciboData = {
    config,
    membro: membro?.nome ?? user?.nome ?? '',
    ano,
    meses: dados.meses.map((m) => ({ label: m.label, valor: m.valor })),
    totalAno: dados.totalAno,
    totalDizimo: dados.totalDizimo,
    totalOferta: dados.totalOferta,
  }

  const imprimir = useReactToPrint({ contentRef: reciboRef, documentTitle: `Recibo-${recibo.membro}-${ano}` })

  if (!membro) {
    return (
      <div className="space-y-4">
        <PageHeader title="Minha conta" />
        <EmptyState
          icon={HeartHandshake}
          title="Sem vínculo de membro"
          description="Este acesso não está ligado a um cadastro de membro. Entre como Irmão para ver sua contribuição."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Minha contribuição" subtitle="Seu histórico com transparência e privacidade" />

      {/* Perfil */}
      <Card className="bg-flame-glow flex items-center gap-4 p-5">
        <Avatar className="size-14 text-base">
          <AvatarFallback>{initials(membro.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold leading-tight">{membro.nome}</h2>
          <p className="text-xs text-muted-foreground">{membro.ministerio}</p>
        </div>
      </Card>

      {/* Totais do ano */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="tabular font-display text-lg font-semibold text-success">{formatBRL(dados.totalDizimo, { compact: true })}</p>
          <p className="text-[11px] text-muted-foreground">dízimos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="tabular font-display text-lg font-semibold text-info">{formatBRL(dados.totalOferta, { compact: true })}</p>
          <p className="text-[11px] text-muted-foreground">ofertas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="tabular font-display text-lg font-semibold">{formatBRL(dados.totalAno, { compact: true })}</p>
          <p className="text-[11px] text-muted-foreground">total {ano}</p>
        </Card>
      </div>

      {/* Recibo */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button variant="flame" size="lg" onClick={() => imprimir()}>
          <Download />
          Baixar recibo de {ano} (PDF)
        </Button>
        <Button
          variant="outline"
          size="lg"
          aria-label="Compartilhar"
          onClick={async () => {
            const txt = `Minha contribuição em ${ano} — ${config.nome}\nDízimos: ${formatBRL(dados.totalDizimo)}\nOfertas: ${formatBRL(dados.totalOferta)}\nTotal: ${formatBRL(dados.totalAno)}`
            const r = await shareText(`Minha contribuição ${ano}`, txt)
            if (r === 'copied') toast.success('Resumo copiado.')
          }}
        >
          <Share2 />
        </Button>
      </div>

      {/* Constância */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold">Minha constância</h2>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados.chart} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="short" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} className="capitalize" />
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
                {dados.chart.map((s, i) => (
                  <Cell key={i} fill={s.valor > 0 ? 'var(--chart-1)' : 'var(--muted)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Histórico */}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Histórico</h2>
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
            <p className="p-6 text-center text-sm text-muted-foreground">
              Você ainda não tem contribuições registradas.
            </p>
          )}
        </Card>
      </div>

      {/* Recibo (fora da tela, para impressão) */}
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden>
        <ReciboDocument ref={reciboRef} data={recibo} />
      </div>
    </div>
  )
}
