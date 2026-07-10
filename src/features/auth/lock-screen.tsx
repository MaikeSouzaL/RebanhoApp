import { useState } from 'react'
import { motion } from 'framer-motion'
import { Delete, LockKeyhole } from 'lucide-react'
import { Emblem } from '@/components/brand/logo'
import { useSession } from '@/store/session'
import { cn } from '@/lib/utils'

export function LockScreen() {
  const unlock = useSession((s) => s.unlock)
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)

  function press(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setErro(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (!unlock(next)) {
          setErro(true)
          setPin('')
        }
      }, 120)
    }
  }
  function back() {
    setPin((p) => p.slice(0, -1))
    setErro(false)
  }

  return (
    <div className="bg-flame-glow flex min-h-dvh flex-col items-center justify-center px-8">
      <Emblem size={84} />
      <div className="mt-4 flex items-center gap-2 text-muted-foreground">
        <LockKeyhole className="size-4" />
        <span className="text-sm font-semibold">App bloqueado</span>
      </div>
      <p className="mt-1 text-center text-sm text-muted-foreground">Digite seu PIN para continuar</p>

      <motion.div
        animate={erro ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="mt-6 flex gap-3"
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'size-3.5 rounded-full border-2 transition-colors',
              i < pin.length ? 'border-primary bg-primary' : 'border-border',
              erro && 'border-destructive',
            )}
          />
        ))}
      </motion.div>
      {erro && <p className="mt-3 text-xs font-semibold text-destructive">PIN incorreto</p>}

      <div className="mt-8 grid w-full max-w-[260px] grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <KeyBtn key={d} onClick={() => press(d)}>
            {d}
          </KeyBtn>
        ))}
        <span />
        <KeyBtn onClick={() => press('0')}>0</KeyBtn>
        <KeyBtn onClick={back} aria-label="Apagar">
          <Delete className="size-5" />
        </KeyBtn>
      </div>
    </div>
  )
}

function KeyBtn({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className="flex h-16 items-center justify-center rounded-2xl border border-border bg-card text-2xl font-semibold shadow-warm active:scale-95 active:bg-accent"
      {...props}
    >
      {children}
    </button>
  )
}
