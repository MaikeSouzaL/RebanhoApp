import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Church,
  HandCoins,
  HeartHandshake,
  Plus,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const OPCOES: { to: string; label: string; desc: string; icon: LucideIcon; color: string }[] = [
  { to: '/novo/dizimo', label: 'Dízimo', desc: 'Contribuição de um membro', icon: HandCoins, color: 'var(--chart-1)' },
  { to: '/novo/oferta', label: 'Oferta', desc: 'Culto, missões, gratidão…', icon: HeartHandshake, color: 'var(--chart-2)' },
  { to: '/novo/despesa', label: 'Despesa', desc: 'Um gasto já pago', icon: ShoppingCart, color: 'var(--chart-3)' },
  { to: '/novo/conta', label: 'Conta a pagar', desc: 'Compromisso com vencimento', icon: Receipt, color: 'var(--warning)' },
  { to: '/culto', label: 'Fechamento de culto', desc: 'Conte a oferta e registre', icon: Church, color: 'var(--flame-via)' },
]

export function QuickAdd() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Novo lançamento"
        className={cn(
          'bg-flame fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex size-14 items-center justify-center rounded-full text-white shadow-lg active:scale-95',
        )}
      >
        <Plus className="size-7" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-3">
          <SheetHeader>
            <SheetTitle>Novo lançamento</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2">
            {OPCOES.map((o) => (
              <button
                key={o.to}
                onClick={() => go(o.to)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left active:scale-[0.99]"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklab, ${o.color} 16%, transparent)`, color: o.color }}
                >
                  <o.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{o.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
