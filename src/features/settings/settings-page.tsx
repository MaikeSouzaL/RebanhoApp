import { useRef, useState } from 'react'
import {
  Download,
  KeyRound,
  Moon,
  RotateCcw,
  Save,
  Sun,
  Type,
  Upload,
} from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { services } from '@/data/services'
import type { CategoriaDespesaId, ConfigIgreja, Database } from '@/data/types'
import { CATEGORIA_MAP } from '@/data/categorias'
import {
  clearPin,
  getFontScale,
  hasPin,
  setFontScale,
  setPin,
  type FontScale,
} from '@/lib/prefs'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/shared/currency-input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FIELDS: { key: keyof ConfigIgreja; label: string }[] = [
  { key: 'nome', label: 'Nome da igreja' },
  { key: 'razaoSocial', label: 'Razão social' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'cidade', label: 'Cidade / UF' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'pastor', label: 'Pastor responsável' },
  { key: 'pastorPresidente', label: 'Pastor presidente (destinatário)' },
  { key: 'pixChave', label: 'Chave Pix' },
]

const ORC_CATS: CategoriaDespesaId[] = [
  'aluguel', 'energia', 'agua', 'internet', 'prebenda', 'som', 'materiais', 'manutencao', 'assistencia', 'missoes',
]

const FONTES: { value: FontScale; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'grande', label: 'Grande' },
  { value: 'maior', label: 'Maior' },
]

export function SettingsPage() {
  const { config, saveConfig, resetDados, importBackup } = useData()
  const { theme, setTheme } = useSession()
  const [form, setForm] = useState<ConfigIgreja>(config)
  const [orc, setOrc] = useState<Partial<Record<CategoriaDespesaId, number>>>(config.orcamento ?? {})
  const [fonte, setFonte] = useState<FontScale>(getFontScale())
  const [pinOn, setPinOn] = useState(hasPin())
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinDialog, setPinDialog] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function salvarDados() {
    saveConfig({ ...form })
    toast.success('Dados da igreja atualizados.')
  }
  function salvarOrcamento() {
    saveConfig({ orcamento: orc })
    toast.success('Orçamento salvo.')
  }
  function trocarFonte(f: FontScale) {
    setFonte(f)
    setFontScale(f)
  }

  function confirmarPin() {
    if (pin1.length !== 4 || !/^\d{4}$/.test(pin1)) return toast.error('O PIN deve ter 4 dígitos.')
    if (pin1 !== pin2) return toast.error('Os PINs não coincidem.')
    setPin(pin1)
    setPinOn(true)
    setPinDialog(false)
    setPin1('')
    setPin2('')
    toast.success('PIN ativado.')
  }
  function onTogglePin(v: boolean) {
    if (v) {
      setPinDialog(true)
    } else {
      clearPin()
      setPinOn(false)
      toast.success('PIN desativado.')
    }
  }

  function exportar() {
    const data = services.snapshot()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rebanho-backup-${formatDate(new Date()).replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup exportado.')
  }
  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Database
        if (!Array.isArray(data.entradas) || !data.config) throw new Error('inválido')
        importBackup(data)
        toast.success('Backup importado com sucesso.')
      } catch {
        toast.error('Arquivo de backup inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Configurações" subtitle="Dados da igreja e preferências" />

      <Card>
        <CardHeader>
          <CardTitle>Dados da igreja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input id={f.key} value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
          <Button className="w-full" onClick={salvarDados}>
            <Save /> Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {/* Orçamento mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamento mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Defina o previsto por categoria. O painel do pastor mostra o realizado × previsto.
          </p>
          {ORC_CATS.map((cat) => (
            <div key={cat} className="space-y-1.5">
              <Label>{CATEGORIA_MAP[cat].label}</Label>
              <CurrencyInput value={orc[cat] ?? 0} onChange={(v) => setOrc((o) => ({ ...o, [cat]: v }))} />
            </div>
          ))}
          <Button className="w-full" onClick={salvarOrcamento}>
            <Save /> Salvar orçamento
          </Button>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência e acessibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              {theme === 'dark' ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-primary" />}
              Tema escuro
            </span>
            <Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
          </div>
          <div>
            <span className="mb-2 flex items-center gap-2.5 text-sm font-medium">
              <Type className="size-5 text-primary" /> Tamanho do texto
            </span>
            <div className="grid grid-cols-3 gap-2">
              {FONTES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => trocarFonte(f.value)}
                  className={cn(
                    'rounded-xl border py-2.5 text-sm font-semibold transition active:scale-[0.98]',
                    fonte === f.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <KeyRound className="size-5 text-primary" /> Exigir PIN ao abrir
            </span>
            <Switch checked={pinOn} onCheckedChange={onTogglePin} />
          </div>
          {pinOn && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setPinDialog(true)}>
              Trocar PIN
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Backup dos dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Exporte um arquivo com todos os dados (para guardar ou passar de um aparelho a outro).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={exportar}>
              <Download /> Exportar
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> Importar
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
          <p className="text-xs text-muted-foreground">Importar substitui todos os dados atuais.</p>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de demonstração</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RotateCcw /> Restaurar dados de exemplo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restaurar dados?</DialogTitle>
                <DialogDescription>
                  Isto substitui todos os lançamentos atuais pelos dados de exemplo. Não pode ser desfeito.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={() => { resetDados(); toast.success('Dados de exemplo restaurados.') }}>
                    Restaurar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        O Rebanho de Jesus Cristo · Gestão financeira — v0.2
      </p>

      {/* Dialog do PIN */}
      <Dialog open={pinDialog} onOpenChange={(v) => { setPinDialog(v); if (!v) { setPin1(''); setPin2('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir PIN de 4 dígitos</DialogTitle>
            <DialogDescription>Será pedido toda vez que o app abrir.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              inputMode="numeric"
              maxLength={4}
              value={pin1}
              onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN"
              className="text-center text-lg tracking-[0.5em]"
            />
            <Input
              inputMode="numeric"
              maxLength={4}
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirmar PIN"
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPinDialog(false); if (!hasPin()) setPinOn(false) }}>
              Cancelar
            </Button>
            <Button onClick={confirmarPin}>Salvar PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
