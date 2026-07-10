import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search, Users } from 'lucide-react'
import { useData } from '@/store/data'
import { formatBRL, initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'

export function MembrosPage() {
  const { membros, entradas } = useData()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const totais = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entradas) {
      if (!e.membroId) continue
      map.set(e.membroId, (map.get(e.membroId) ?? 0) + e.valor)
    }
    return map
  }, [entradas])

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return membros
      .filter((mem) => (q ? mem.nome.toLowerCase().includes(q) : true))
      .sort((a, b) => (totais.get(b.id) ?? 0) - (totais.get(a.id) ?? 0))
  }, [membros, busca, totais])

  return (
    <div className="space-y-4">
      <PageHeader title="Membros" subtitle={`${membros.length} cadastrados · contribuições no ano`} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar membro…" className="pl-9" />
      </div>

      {lista.length ? (
        <Card className="divide-y divide-border p-0">
          {lista.map((mem) => (
            <button
              key={mem.id}
              onClick={() => navigate(`/membros/${mem.id}`)}
              className="flex w-full items-center gap-3 p-3.5 text-left active:bg-accent"
            >
              <Avatar className="size-11">
                <AvatarFallback>{initials(mem.nome)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{mem.nome}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{mem.ministerio}</span>
                  {!mem.ativo && <Badge variant="secondary">Inativo</Badge>}
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold text-success">
                  {formatBRL(totais.get(mem.id) ?? 0, { compact: true })}
                </p>
                <p className="text-[11px] text-muted-foreground">total</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </Card>
      ) : (
        <EmptyState icon={Users} title="Nenhum membro" description="Ajuste a busca." />
      )}
    </div>
  )
}
