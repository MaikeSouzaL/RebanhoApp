import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSession } from '@/store/session'
import { toast } from 'sonner'

/** Logo oficial do Google (SVG), para o botão seguir a marca deles. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04L5.85 9.88C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

/** Botão "Continuar com Google" — usado no login e no cadastro. */
export function GoogleButton({ texto = 'Continuar com Google' }: { texto?: string }) {
  const entrarComGoogle = useSession((s) => s.entrarComGoogle)
  const [indo, setIndo] = useState(false)

  async function clicar() {
    setIndo(true)
    const res = await entrarComGoogle()
    // Se der certo, o navegador já foi para o Google; só tratamos erro.
    if (!res.ok) {
      setIndo(false)
      toast.error(res.erro ?? 'Não foi possível entrar com o Google.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={clicar}
        disabled={indo}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-3 text-sm font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      >
        {indo ? <Loader2 className="size-4 animate-spin" /> : <GoogleG className="size-5" />}
        {texto}
      </button>
    </div>
  )
}
