import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Search, UserPlus, UserRound } from 'lucide-react'
import { useData } from '@/store/data'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  customName?: string
  onCustomNameChange?: (value: string) => void
  allowCustomName?: boolean
}

export function MemberPicker({
  value,
  onChange,
  allowAnonimo = true,
  customName = '',
  onCustomNameChange,
  allowCustomName = false,
}: MemberPickerProps) {
  const { membros } = useData()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [viewport, setViewport] = useState<{ bottom: number; maxHeight: number }>()

  // Em alguns navegadores mobile o teclado cobre elementos `position: fixed`
  // sem atualizar corretamente o `dvh`. VisualViewport informa a área que
  // continua realmente visível e permite manter o modal acima do teclado.
  useEffect(() => {
    if (!open || !window.visualViewport) {
      setViewport(undefined)
      return
    }

    const visualViewport = window.visualViewport
    const updateViewport = () => {
      const bottom = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop,
      )
      setViewport({
        bottom,
        maxHeight: Math.max(0, Math.min(window.innerHeight * 0.8, visualViewport.height - 8)),
      })
    }

    updateViewport()
    visualViewport.addEventListener('resize', updateViewport)
    visualViewport.addEventListener('scroll', updateViewport)
    return () => {
      visualViewport.removeEventListener('resize', updateViewport)
      visualViewport.removeEventListener('scroll', updateViewport)
    }
  }, [open])

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
    onCustomNameChange?.('')
    setOpen(false)
    setBusca('')
  }

  function chooseCustomName() {
    const nome = busca.trim()
    if (!nome) return
    onChange(null)
    onCustomNameChange?.(nome)
    setOpen(false)
    setBusca('')
  }

  const customNameOption = busca.trim()
  const hasExactMember = lista.some(
    (m) => m.nome.localeCompare(customNameOption, 'pt-BR', { sensitivity: 'base' }) === 0,
  )

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
          ) : customName ? (
            <>
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-primary">
                <UserPlus className="size-4" />
              </span>
              <span className="flex-1 truncate text-sm font-medium">{customName}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">sem cadastro</span>
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
      <SheetContent
        side="bottom"
        className="max-h-[80dvh]"
        contentClassName="gap-2 overflow-hidden p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={viewport ? { bottom: viewport.bottom, maxHeight: viewport.maxHeight } : undefined}
      >
        <SheetHeader className="gap-0.5 pr-10">
          <SheetTitle>Selecionar membro</SheetTitle>
          <SheetDescription>
            Busque um cadastro ou informe apenas o nome.
          </SheetDescription>
        </SheetHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome da pessoa"
            aria-label="Buscar membro ou informar nome"
            className="h-12 pl-10 text-base shadow-none"
          />
        </div>
        <div className="shrink-0 space-y-1.5 border-b border-border/60 pb-2">
          {allowCustomName && customNameOption && !hasExactMember && (
            <button
              type="button"
              onClick={chooseCustomName}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 active:bg-primary/12"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <UserPlus className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">Usar “{customNameOption}”</span>
                <span className="block text-xs text-muted-foreground">Registrar sem criar cadastro</span>
              </span>
              {customName === customNameOption && <Check className="size-4 text-primary" />}
            </button>
          )}
          {allowAnonimo && (
            <button
              type="button"
              onClick={() => choose(null)}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 active:bg-accent',
                value === null && !customName && 'bg-secondary/70',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <UserRound className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Registrar como anônimo</span>
                <span className="block text-xs text-muted-foreground">Quando a pessoa não se identificar</span>
              </span>
              {value === null && !customName && <Check className="size-4 text-primary" />}
            </button>
          )}
        </div>
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pt-1">
          <p className="sticky top-0 z-10 bg-card px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Membros cadastrados
          </p>
          {lista.length === 0 && (
            <p className="px-2 py-5 text-center text-sm text-muted-foreground">
              Nenhum membro encontrado com esse nome.
            </p>
          )}
          {lista.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/35 active:bg-accent"
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
