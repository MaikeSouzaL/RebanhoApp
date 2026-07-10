import { useMemo } from 'react'
import { Cake, MessageCircle, PartyPopper } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/store/data'
import { initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'

export function AniversariantesPage() {
  const { membros } = useData()
  const now = new Date()
  const mesLabel = format(now, 'MMMM', { locale: ptBR })

  const lista = useMemo(() => {
    const mes = now.getMonth() + 1
    return membros
      .filter((m) => m.nascimento && Number(m.nascimento.slice(5, 7)) === mes)
      .map((m) => {
        const [y, , d] = m.nascimento!.split('-').map(Number)
        return { membro: m, dia: d ?? 1, idade: now.getFullYear() - (y ?? now.getFullYear()) }
      })
      .sort((a, b) => a.dia - b.dia)
  }, [membros])

  function whatsapp(tel?: string) {
    if (!tel) return undefined
    const digits = tel.replace(/\D/g, '')
    return `https://wa.me/55${digits}?text=${encodeURIComponent('Feliz aniversário! Que Deus te abençoe. 🎉')}`
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Aniversariantes" subtitle={`De ${mesLabel}`} />

      {lista.length ? (
        <Card className="divide-y divide-border p-0">
          {lista.map(({ membro, dia, idade }) => (
            <div key={membro.id} className="flex items-center gap-3 p-3.5">
              <Avatar className="size-11">
                <AvatarFallback>{initials(membro.nome)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{membro.nome}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cake className="size-3.5" /> Dia {dia} · faz {idade} anos
                </p>
              </div>
              {membro.telefone && (
                <a
                  href={whatsapp(membro.telefone)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-xl bg-success/12 text-success active:scale-95"
                  aria-label="Parabenizar no WhatsApp"
                >
                  <MessageCircle className="size-4" />
                </a>
              )}
              {dia === now.getDate() && <Badge variant="gold"><PartyPopper /> Hoje</Badge>}
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={Cake} title="Nenhum aniversariante" description={`Ninguém faz aniversário em ${mesLabel}.`} />
      )}
    </div>
  )
}
