import { useEffect, useState } from 'react'
import { Download, MoreVertical, Share, SquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Emblem } from '@/components/brand/logo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Dispensa é só da SESSÃO atual — o convite volta ao reabrir o app.
const DISMISS_KEY = 'rebanho-install-dismissed'
// Marca de versões antigas. Não é mais usada como verdade (ela ficava presa
// depois de desinstalar); só limpamos caso ainda exista no aparelho.
const INSTALLED_KEY = 'rebanho-installed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
function isIOS() {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
}
function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

/**
 * "Já instalado" = está rodando como app instalado AGORA (janela standalone).
 *
 * Antes isto também olhava uma marca no localStorage que, uma vez gravada,
 * nunca saía — então quem desinstalava continuava sem ver o convite. Detectar
 * pela janela standalone se corrige sozinho: desinstalou, volta a aparecer.
 */
function jaInstalado() {
  return isStandalone()
}

/** Evento interno para reabrir o convite pelo menu. */
export const EVENTO_INSTALAR = 'rebanho:instalar'

/** Reabre o convite de instalação (usado pelo item "Instalar app" do menu). */
export function pedirInstalacao() {
  sessionStorage.removeItem(DISMISS_KEY)
  window.dispatchEvent(new Event(EVENTO_INSTALAR))
}

/** O item de menu só some quando o app já está aberto como instalado. */
export function appInstalado() {
  return isStandalone()
}

/**
 * Convite de instalação do PWA.
 *
 * Aparece SEMPRE que o app não estiver instalado — não depende de o navegador
 * disparar `beforeinstallprompt`, que só ocorre no Chrome/Edge e nunca em
 * desenvolvimento. Quando o evento existe, o botão instala de verdade; quando
 * não existe, mostramos o caminho manual de cada plataforma.
 */
export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Remove a marca antiga que ficava presa e escondia o convite para sempre.
    try {
      localStorage.removeItem(INSTALLED_KEY)
    } catch {
      /* aparelho sem localStorage — ignora */
    }

    const onPrompt = (e: Event) => {
      // O evento disparar já prova que o app NÃO está instalado (é instalável).
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      if (!jaInstalado() && !sessionStorage.getItem(DISMISS_KEY)) setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
    }
    // Pedido manual pelo menu: reabre mesmo depois de dispensado.
    const onManual = () => {
      if (!jaInstalado()) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener(EVENTO_INSTALAR, onManual)

    // Mostra de qualquer forma, mesmo sem o evento do navegador.
    const t =
      jaInstalado() || sessionStorage.getItem(DISMISS_KEY)
        ? undefined
        : setTimeout(() => setVisible(true), 1200)

    return () => {
      if (t) clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener(EVENTO_INSTALAR, onManual)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!evt) return
    await evt.prompt()
    await evt.userChoice
    // Não gravamos nada de permanente: se instalar, o app passa a abrir em
    // janela standalone e o convite some sozinho; se desinstalar, volta.
    setVisible(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md">
      <div className="glass pointer-events-auto rounded-2xl border border-border p-3 shadow-warm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-card p-1 shadow-sm ring-1 ring-border">
            <Emblem size={40} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalar o app</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              <Instrucao temEvento={!!evt} />
            </p>
          </div>
          <button onClick={dismiss} className="rounded-lg p-1 text-muted-foreground" aria-label="Agora não">
            <X className="size-4" />
          </button>
        </div>
        {evt && (
          <Button size="sm" className="mt-2.5 w-full" onClick={install}>
            <Download />
            Instalar agora
          </Button>
        )}
      </div>
    </div>
  )
}

/** Caminho de instalação conforme o navegador da pessoa. */
function Instrucao({ temEvento }: { temEvento: boolean }) {
  if (temEvento) return <>Tenha o Rebanho na tela inicial e use offline.</>
  if (isIOS()) {
    return (
      <>
        Toque em <Share className="inline size-3.5 -translate-y-0.5 text-info" /> <b>Compartilhar</b> e
        depois em <SquarePlus className="inline size-3.5 -translate-y-0.5 text-primary" />{' '}
        <b>Adicionar à Tela de Início</b>.
      </>
    )
  }
  if (isAndroid()) {
    return (
      <>
        Toque em <MoreVertical className="inline size-3.5 -translate-y-0.5" /> (menu do navegador) e
        escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
      </>
    )
  }
  return (
    <>
      No menu do navegador, escolha <b>Instalar O Rebanho</b> — ou clique no ícone de instalar na
      barra de endereço.
    </>
  )
}
