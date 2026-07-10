import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logomark } from '@/components/brand/logo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'rebanho-install-dismissed'

/** Banner custom de instalação do PWA (aparece quando o navegador permite). */
export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    const handler = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || !evt) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!evt) return
    await evt.prompt()
    await evt.userChoice
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
      <div className="glass flex items-center gap-3 rounded-2xl border border-border p-3 shadow-warm">
        <Logomark size={38} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar o app</p>
          <p className="truncate text-xs text-muted-foreground">Acesse offline, direto da tela inicial.</p>
        </div>
        <Button size="sm" onClick={install}>
          <Download />
          Instalar
        </Button>
        <button onClick={dismiss} className="rounded-lg p-1 text-muted-foreground" aria-label="Dispensar">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
