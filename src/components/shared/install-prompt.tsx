import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logomark } from '@/components/brand/logo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'rebanho-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
function isIOS() {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
}

/**
 * Convite de instalação do PWA.
 * - Android/Chrome/Edge: usa o evento beforeinstallprompt (botão "Instalar").
 * - iOS/Safari: mostra instruções (Compartilhar → Adicionar à Tela de Início).
 */
export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    if (isIOS()) {
      setIos(true)
      const t = setTimeout(() => setVisible(true), 1800)
      return () => clearTimeout(t)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!visible) return null

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
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md">
      <div className="glass pointer-events-auto rounded-2xl border border-border p-3 shadow-warm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-card p-1 shadow-sm ring-1 ring-border">
            <Logomark size={40} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalar o app</p>
            {ios ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Toque em <Share className="inline size-3.5 -translate-y-0.5 text-info" /> <b>Compartilhar</b> e depois em{' '}
                <SquarePlus className="inline size-3.5 -translate-y-0.5 text-primary" /> <b>Adicionar à Tela de Início</b>.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Acesse offline, direto da tela inicial do celular.</p>
            )}
          </div>
          <button onClick={dismiss} className="rounded-lg p-1 text-muted-foreground" aria-label="Dispensar">
            <X className="size-4" />
          </button>
        </div>
        {!ios && (
          <Button size="sm" className="mt-2.5 w-full" onClick={install}>
            <Download />
            Instalar agora
          </Button>
        )}
      </div>
    </div>
  )
}
