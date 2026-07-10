import { useState } from 'react'
import { Moon, RotateCcw, Save, Sun } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import type { ConfigIgreja } from '@/data/types'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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

export function SettingsPage() {
  const { config, saveConfig, resetDados } = useData()
  const { theme, setTheme } = useSession()
  const [form, setForm] = useState<ConfigIgreja>(config)

  function salvar() {
    saveConfig(form)
    toast.success('Dados da igreja atualizados.')
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
              <Input
                id={f.key}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <Button className="w-full" onClick={salvar}>
            <Save />
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              {theme === 'dark' ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-primary" />}
              Tema escuro
            </span>
            <Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados de demonstração</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Restaura todos os lançamentos de exemplo. Útil para testes.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RotateCcw />
                Restaurar dados de exemplo
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
                  <Button
                    variant="destructive"
                    onClick={() => {
                      resetDados()
                      toast.success('Dados de exemplo restaurados.')
                    }}
                  >
                    Restaurar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        O Rebanho de Jesus Cristo · Gestão financeira — v0.1 · Fase 1 (Pastor)
      </p>
    </div>
  )
}
