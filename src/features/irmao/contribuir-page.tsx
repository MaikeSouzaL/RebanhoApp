import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, HandCoins, HeartHandshake, Info } from 'lucide-react'
import { useData } from '@/store/data'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ContribuirPage() {
  const { config } = useData()
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(config.pixChave)
      setCopiado(true)
      toast.success('Chave Pix copiada!')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Contribuir" subtitle="Dízimos e ofertas pela paz de Deus" />

      {/* Cartão Pix com QR */}
      <Card className="bg-flame-glow flex flex-col items-center p-6 text-center">
        <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          Pix · {config.pixTipo}
        </span>
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-warm">
          <QRCodeSVG value={config.pixChave} size={168} fgColor="#17231C" bgColor="#ffffff" level="M" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold">{config.nome}</p>
        <p className="text-xs text-muted-foreground">{config.razaoSocial}</p>

        <div className="mt-4 w-full rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Chave Pix</p>
          <p className="tabular mt-0.5 break-all text-sm font-semibold">{config.pixChave}</p>
        </div>
        <Button className="mt-3 w-full" onClick={copiar}>
          {copiado ? <Check /> : <Copy />}
          {copiado ? 'Copiada!' : 'Copiar chave Pix'}
        </Button>
      </Card>

      {/* O que é dízimo/oferta */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
            <HandCoins className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Dízimo</p>
            <p className="text-sm text-muted-foreground">
              A décima parte, entregue com fidelidade e gratidão ao Senhor (Ml 3.10).
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/12 text-info">
            <HeartHandshake className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Oferta</p>
            <p className="text-sm text-muted-foreground">
              Ofertas voluntárias — cultos, missões, construção e ações sociais — dadas com alegria (2Co 9.7).
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-accent/50 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-accent-foreground">
          Ao contribuir por Pix, envie o comprovante à tesouraria para que sua contribuição seja
          registrada e apareça em <strong>Minha conta</strong>.
        </p>
      </div>
    </div>
  )
}
