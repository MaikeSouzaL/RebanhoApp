import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, HandCoins, HeartHandshake, Info, QrCode } from 'lucide-react'
import { useData } from '@/store/data'
import { montarPixCopiaECola } from '@/lib/pix'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { toast } from 'sonner'

export function ContribuirPage() {
  const { config } = useData()
  const [copiado, setCopiado] = useState<'chave' | 'codigo' | null>(null)

  const temChave = !!config.pixChave?.trim()
  // Pix Copia e Cola de verdade (escaneável no app do banco).
  const codigoPix = montarPixCopiaECola({
    chave: config.pixChave,
    nome: config.razaoSocial || config.nome,
    cidade: config.cidade,
  })

  async function copiar(oque: 'chave' | 'codigo', texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(oque)
      toast.success(oque === 'chave' ? 'Chave Pix copiada!' : 'Pix copia e cola copiado!')
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Contribuir" subtitle="Dízimos e ofertas pela paz de Deus" />

      {temChave ? (
        /* Cartão Pix com QR escaneável */
        <Card className="bg-flame-glow flex flex-col items-center p-6 text-center">
          <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            Pix · {config.pixTipo}
          </span>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-warm">
            <QRCodeSVG value={codigoPix} size={188} fgColor="#17231C" bgColor="#ffffff" level="M" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold">{config.nome}</p>
          <p className="text-xs text-muted-foreground">{config.razaoSocial}</p>

          <div className="mt-4 w-full rounded-xl border border-border bg-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Chave Pix
            </p>
            <p className="tabular mt-0.5 break-all text-sm font-semibold">{config.pixChave}</p>
          </div>
          <div className="mt-3 grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => copiar('chave', config.pixChave)}>
              {copiado === 'chave' ? <Check /> : <Copy />}
              {copiado === 'chave' ? 'Copiada!' : 'Copiar chave'}
            </Button>
            <Button onClick={() => copiar('codigo', codigoPix)}>
              {copiado === 'codigo' ? <Check /> : <QrCode />}
              {copiado === 'codigo' ? 'Copiado!' : 'Copia e cola'}
            </Button>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={QrCode}
          title="Pix ainda não configurado"
          description="O pastor precisa cadastrar a chave Pix da igreja em Configurações para que as contribuições apareçam aqui."
        />
      )}

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
