import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search, UserRound } from 'lucide-react'
import { useData } from '@/store/data'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MemberPickerProps {
  value: string | null // membroId ou null (anônimo)
  onChange: (value: string | null) => void
  allowAnonimo?: boolean
}

export function MemberPicker({ value, onChange, allowAnonimo = true }: MemberPickerProps) {
  const { membros } = useData()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')

  const selecionado = value ? membros.find((m) => m.id === value) : null
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return membros
      .filter((m) => m.ativo || m.id === value)
      .filter((m) => (q ? m.nome.toLowerCase().includes(q) : true))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [membros, busca, value])

  function choose(id: string | null) {
    onChange(id)
    setOpen(false)
    setBusca('')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-left shadow-sm active:scale-[0.99]"
        >
          {selecionado ? (
            <>
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px]">{initials(selecionado.nome)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm font-medium">{selecionado.nome}</span>
            </>
          ) : (
            <>
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <UserRound className="size-4" />
              </span>
              <span className="flex-1 text-sm text-muted-foreground">
                {value === null ? 'Anônimo' : 'Selecionar membro'}
              </span>
            </>
          )}
          <ChevronDown className="size-4 opacity-60" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh]">
        <SheetHeader>
          <SheetTitle>Selecionar membro</SheetTitle>
        </SheetHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar membro…"
            className="pl-9"
          />
        </div>
        <div className="-mx-2 overflow-y-auto">
          {allowAnonimo && (
            <button
              type="button"
              onClick={() => choose(null)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-accent"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <UserRound className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">Anônimo / não identificado</span>
              {value === null && <Check className="size-4 text-primary" />}
            </button>
          )}
          {lista.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-accent"
            >
              <Avatar className="size-9">
                <AvatarFallback className="text-[11px]">{initials(m.nome)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{m.nome}</span>
                <span className="block text-xs text-muted-foreground">{m.ministerio}</span>
              </span>
              {value === m.id && <Check className={cn('size-4 text-primary')} />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
