import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowRight,
  Check,
  Copy,
  HandCoins,
  HeartHandshake,
  Info,
  Loader2,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { services } from '@/data/services'
import { montarPixCopiaECola } from '@/lib/pix'
import { isoDayOf } from '@/lib/report'
import { formatBRL } from '@/lib/format'
import type { TipoEntrada } from '@/data/types'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/ui/segmented'
import { CurrencyInput } from '@/components/shared/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'

// Finalidades de oferta que o membro pode escolher. O mapa leva cada uma ao
// fundo certo (mesma lógica do lançamento do tesoureiro).
const FINALIDADES = ['Oferta de culto', 'Missões', 'Construção', 'Gratidão'] as const
type Finalidade = (typeof FINALIDADES)[number]

export function ContribuirPage() {
  const { config, fundos, membros, recarregar } = useData()
  const { user } = useSession()

  const [tipo, setTipo] = useState<Exclude<TipoEntrada, 'outra'>>('dizimo')
  const [finalidade, setFinalidade] = useState<Finalidade>('Oferta de culto')
  const [valor, setValor] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState<'chave' | 'codigo' | null>(null)
  const [registrado, setRegistrado] = useState<{ tipo: string; valor: number } | null>(null)

  const temChave = !!config.pixChave?.trim()
  const meuMembro = user?.membroId ? membros.find((m) => m.id === user.membroId) : undefined
  const meuNome = meuMembro?.nome ?? user?.nome ?? ''

  // Fundo real do banco conforme a escolha — nunca um id fixo que pode não existir.
  const fundoDe = (slug: string) => fundos.find((f) => f.id === slug)?.id ?? fundos[0]?.id ?? ''
  const fundoAlvo =
    tipo === 'dizimo'
      ? fundoDe('f-geral')
      : finalidade === 'Missões'
        ? fundoDe('f-missoes')
        : finalidade === 'Construção'
          ? fundoDe('f-obras')
          : fundoDe('f-geral')

  // Pix Copia e Cola de verdade — com o valor embutido, o app do banco já abre
  // com o valor preenchido para o irmão só confirmar.
  const codigoPix = useMemo(
    () =>
      montarPixCopiaECola({
        chave: config.pixChave,
        nome: config.razaoSocial || config.nome,
        cidade: config.cidade,
        valor: valor > 0 ? valor : undefined,
      }),
    [config.pixChave, config.razaoSocial, config.nome, config.cidade, valor],
  )

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

  async function registrar() {
    if (!user?.membroId) {
      toast.error('Seu acesso não está ligado a um cadastro de membro.')
      return
    }
    if (valor <= 0) {
      toast.error('Informe o valor da sua contribuição.')
      return
    }
    setSalvando(true)
    try {
      // Vai direto ao serviço (não pelo store) para sabermos de verdade se
      // gravou — o RLS só deixa o membro registrar a própria contribuição.
      await services.addEntrada({
        tipo,
        subtipo: tipo === 'oferta' ? finalidade : undefined,
        valor,
        data: isoDayOf(new Date()),
        forma: 'pix',
        fundoId: fundoAlvo,
        membroId: user.membroId,
        origem: 'membro',
      })
      await recarregar()
      setRegistrado({ tipo: tipo === 'dizimo' ? 'Dízimo' : finalidade, valor })
      setValor(0)
      toast.success('Contribuição registrada! Que Deus abençoe. 🙌')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível registrar.')
    } finally {
      setSalvando(false)
    }
  }

  if (!temChave) {
    return (
      <div className="space-y-4">
        <PageHeader title="Contribuir" subtitle="Dízimos e ofertas com gratidão" />
        <EmptyState
          icon={QrCode}
          title="Pix ainda não configurado"
          description="O pastor precisa cadastrar a chave Pix da igreja em Configurações para que as contribuições apareçam aqui."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <PageHeader title="Contribuir" subtitle="Dízimos e ofertas com gratidão" />

      {/* Sucesso da última contribuição registrada */}
      {registrado && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-success">
              {registrado.tipo} de {formatBRL(registrado.valor)} registrado
            </p>
            <p className="text-xs text-muted-foreground">
              No seu nome — já aparece para a tesouraria e em Minha conta.
            </p>
          </div>
          <Link to="/minha" className="shrink-0">
            <Button variant="outline" size="sm">
              Ver <ArrowRight />
            </Button>
          </Link>
        </div>
      )}

      {/* Escolha do tipo + valor (lado a lado no desktop) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-4">
          <Label>O que você quer ofertar?</Label>
          <Segmented
            value={tipo}
            onChange={(v) => setTipo(v as 'dizimo' | 'oferta')}
            options={[
              { value: 'dizimo', label: 'Dízimo' },
              { value: 'oferta', label: 'Oferta' },
            ]}
          />
          {tipo === 'oferta' && (
            <div className="space-y-1.5">
              <Label htmlFor="finalidade">Finalidade</Label>
              <Select value={finalidade} onValueChange={(v) => setFinalidade(v as Finalidade)}>
                <SelectTrigger id="finalidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINALIDADES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        <Card className="space-y-2 p-4">
          <Label htmlFor="valor">Quanto você vai contribuir?</Label>
          <CurrencyInput
            id="valor"
            value={valor}
            onChange={setValor}
            className="h-12 text-lg [&_input]:text-lg [&_span]:text-lg"
          />
          {meuNome && (
            <p className="text-xs text-muted-foreground">
              No nome de <strong className="text-foreground">{meuNome}</strong>
            </p>
          )}
        </Card>
      </div>

      {/* Cartão Pix com QR escaneável (valor já embutido) */}
      <Card className="bg-flame-glow flex flex-col items-center p-6 text-center">
        <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          Pix · {config.pixTipo}
          {valor > 0 && <> · {formatBRL(valor)}</>}
        </span>
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-warm">
          <QRCodeSVG value={codigoPix} size={188} fgColor="#17231C" bgColor="#ffffff" level="M" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold">{config.nome}</p>
        {config.razaoSocial && <p className="text-xs text-muted-foreground">{config.razaoSocial}</p>}

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

      {/* Registrar a contribuição no nome do membro */}
      <Button
        variant="flame"
        size="lg"
        className="w-full"
        disabled={valor <= 0 || salvando}
        onClick={registrar}
      >
        {salvando ? <Loader2 className="animate-spin" /> : <HandCoins />}
        {salvando ? 'Registrando…' : 'Já fiz o Pix — registrar contribuição'}
      </Button>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-accent/50 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-accent-foreground">
          Faça o Pix pelo app do seu banco (o valor já vai preenchido) e depois toque em{' '}
          <strong>registrar</strong>. Sua contribuição fica no seu nome para a tesouraria conferir e
          aparece em <strong>Minha conta</strong>.
        </p>
      </div>

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
              Ofertas voluntárias — cultos, missões, construção e ações sociais — dadas com alegria
              (2Co 9.7).
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
