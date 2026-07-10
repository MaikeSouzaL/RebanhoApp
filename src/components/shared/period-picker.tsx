import { useState } from 'react'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { subMonths, subQuarters } from 'date-fns'
import { useSession } from '@/store/session'
import {
  customPeriod,
  monthPeriod,
  quarterPeriod,
  type Period,
} from '@/lib/report'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function buildPresets(): { key: string; label: string; period: Period }[] {
  const now = new Date()
  return [
    { key: 'm0', label: 'Este mês', period: monthPeriod(now) },
    { key: 'm1', label: 'Mês passado', period: monthPeriod(subMonths(now, 1)) },
    { key: 'q0', label: 'Este trimestre', period: quarterPeriod(now) },
    { key: 'q1', label: 'Trimestre passado', period: quarterPeriod(subQuarters(now, 1)) },
  ]
}

export function PeriodPicker({ className }: { className?: string }) {
  const { period, setPeriod } = useSession()
  const [open, setOpen] = useState(false)
  const [ini, setIni] = useState('')
  const [fim, setFim] = useState('')
  const presets = buildPresets()

  function choose(p: Period) {
    setPeriod(p)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-sm active:scale-[0.98]',
            className,
          )}
        >
          <CalendarRange className="size-4 text-primary" />
          <span>{period.label}</span>
          <ChevronDown className="size-4 opacity-60" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-3">
        <SheetHeader>
          <SheetTitle>Selecionar período</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const active = p.period.inicio === period.inicio && p.period.fim === period.fim
            return (
              <button
                key={p.key}
                onClick={() => choose(p.period)}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition',
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                )}
              >
                <span>
                  {p.label}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {p.period.label}
                  </span>
                </span>
                {active && <Check className="size-4" />}
              </button>
            )
          })}
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground">Período personalizado</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={ini} onChange={(e) => setIni(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <Button
            className="mt-3 w-full"
            variant="secondary"
            disabled={!ini || !fim || ini > fim}
            onClick={() => choose(customPeriod(ini, fim))}
          >
            Aplicar intervalo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
