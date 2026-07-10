import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { addDays, parseISO } from 'date-fns'
import { FileText, History, Printer } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import {
  entradasPorTipo,
  filterEntradas,
  filterSaidas,
  isoDayOf,
  saidasPorCategoria,
  saldoAcumulado,
  saldoPorFundo,
  statusConta,
  sum,
} from '@/lib/report'
import { formatBRL, formatDate, formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodPicker } from '@/components/shared/period-picker'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReportDocument, type ReportData } from './report-document'
import { toast } from 'sonner'

export function RelatoriosPage() {
  const { entradas, saidas, contasPagar, fundos, config, relatorios, addRelatorio } = useData()
  const { period, user } = useSession()

  const docRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.44)
  const [docH, setDocH] = useState(1123)

  const data: ReportData = useMemo(() => {
    const entP = filterEntradas(entradas, period)
    const saiP = filterSaidas(saidas, period)
    const totalEntradas = sum(entP)
    const totalSaidas = sum(saiP)
    const saldoInicial = saldoAcumulado(entradas, saidas, isoDayOf(addDays(parseISO(period.inicio), -1)))
    const resultado = totalEntradas - totalSaidas
    return {
      config,
      period,
      saldoInicial,
      totalEntradas,
      totalSaidas,
      resultado,
      saldoFinal: saldoInicial + resultado,
      porTipo: entradasPorTipo(entP),
      saidasCategorias: saidasPorCategoria(saiP),
      fundos: saldoPorFundo(fundos, entradas, saidas, period),
      contasAbertas: contasPagar
        .filter((c) => statusConta(c) !== 'pago')
        .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1)),
      geradoPor: user?.nome ?? 'Pastor',
    }
  }, [entradas, saidas, contasPagar, fundos, config, period, user])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / 794)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (docRef.current) setDocH(docRef.current.offsetHeight)
  }, [data])

  const print = useReactToPrint({
    contentRef: docRef,
    documentTitle: `Prestacao-de-contas-${period.inicio}`,
  })

  function gerar() {
    addRelatorio({
      titulo: `Prestação de contas — ${period.label}`,
      tipo: period.tipo,
      periodoInicio: period.inicio,
      periodoFim: period.fim,
      geradoPor: user?.nome ?? 'Pastor',
    })
    toast.success('Relatório registrado. Abrindo impressão…')
    setTimeout(() => print(), 250)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Relatórios"
        subtitle="Prestação de contas para o Pastor Presidente"
        action={<PeriodPicker />}
      />

      {/* Resumo rápido do período escolhido */}
      <Card className="p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="tabular font-display text-base font-semibold text-success">
              {formatBRL(data.totalEntradas, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="tabular font-display text-base font-semibold text-[color:var(--chart-3)]">
              {formatBRL(data.totalSaidas, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resultado</p>
            <p className={`tabular font-display text-base font-semibold ${data.resultado >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatBRL(data.resultado, { compact: true })}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" variant="flame" onClick={gerar}>
          <Printer />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Pré-visualização A4 */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <FileText className="size-4" /> Pré-visualização (A4)
        </p>
        <div
          ref={wrapRef}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-warm"
          style={{ height: docH * scale }}
        >
          <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ReportDocument ref={docRef} data={data} />
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <History className="size-4" /> Relatórios gerados
        </p>
        <Card className="divide-y divide-border p-0">
          {relatorios.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.periodoInicio)} a {formatDate(r.periodoFim)} · gerado {formatDateTime(r.geradoEm)}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {r.tipo}
              </Badge>
            </div>
          ))}
          {!relatorios.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
