import { useData } from '@/store/data'
import type { AcaoAudit } from '@/data/types'
import { formatBRL, formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import {
  FileText,
  History,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const ACAO: Record<AcaoAudit, { icon: LucideIcon; cor: string; verbo: string }> = {
  criou: { icon: Plus, cor: 'var(--chart-1)', verbo: 'registrou' },
  editou: { icon: Pencil, cor: 'var(--chart-2)', verbo: 'editou' },
  excluiu: { icon: Trash2, cor: 'var(--destructive)', verbo: 'excluiu' },
  pagou: { icon: Wallet, cor: 'var(--chart-3)', verbo: 'pagou' },
  gerou: { icon: FileText, cor: 'var(--chart-4)', verbo: 'gerou' },
  importou: { icon: Upload, cor: 'var(--muted-foreground)', verbo: 'importou' },
}

export function AtividadePage() {
  const { auditoria } = useData()

  return (
    <div className="space-y-4">
      <PageHeader title="Atividade" subtitle="Quem fez o quê, e quando" />

      {auditoria.length ? (
        <Card className="divide-y divide-border p-0">
          {auditoria.map((a) => {
            const meta = ACAO[a.acao]
            return (
              <div key={a.id} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklab, ${meta.cor} 16%, transparent)`, color: meta.cor }}
                >
                  <meta.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{a.usuario}</span>{' '}
                    <span className="text-muted-foreground">{meta.verbo}</span>{' '}
                    {a.entidade}
                    {a.descricao ? <span className="text-muted-foreground"> · {a.descricao}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.ts)}</p>
                </div>
                {a.valor != null && (
                  <span className="tabular shrink-0 text-sm font-semibold">{formatBRL(a.valor, { compact: true })}</span>
                )}
              </div>
            )
          })}
        </Card>
      ) : (
        <EmptyState icon={History} title="Sem atividade ainda" description="As ações feitas no app aparecerão aqui." />
      )}
    </div>
  )
}
