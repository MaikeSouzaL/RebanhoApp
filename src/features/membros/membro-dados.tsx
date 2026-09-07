import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useData } from '@/store/data'
import type { Membro } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const CAMPOS: { chave: keyof Membro; label: string; tipo?: string; placeholder?: string }[] = [
  { chave: 'nome', label: 'Nome completo' },
  { chave: 'telefone', label: 'Telefone', tipo: 'tel', placeholder: '(00) 00000-0000' },
  { chave: 'email', label: 'E-mail', tipo: 'email', placeholder: 'voce@exemplo.com' },
  { chave: 'ministerio', label: 'Ministério', placeholder: 'Louvor, Diaconato…' },
  { chave: 'nascimento', label: 'Nascimento', tipo: 'date' },
  { chave: 'batizadoEm', label: 'Data de batismo', tipo: 'date' },
]

/**
 * Editor dos dados de um membro, salvo no banco. É reutilizado em vários
 * lugares: o pastor edita nas Configurações os próprios dados; o pastor e o
 * tesoureiro editam a ficha de qualquer membro; e cada pessoa ajusta a sua.
 * Quem pode salvar cada ficha é decidido pelo banco (RLS) — se não puder, a
 * gravação volta com aviso.
 */
export function MembroDados({
  membroId,
  titulo = 'Dados',
  descricao,
}: {
  membroId: string | undefined
  titulo?: string
  descricao?: string
}) {
  const membros = useData((s) => s.membros)
  const updateMembro = useData((s) => s.updateMembro)
  const membro = membros.find((m) => m.id === membroId)

  const [form, setForm] = useState<Membro | null>(membro ?? null)
  const [salvando, setSalvando] = useState(false)

  // Mantém o formulário em dia quando a ficha chega/atualiza pela rede.
  useEffect(() => {
    if (membro) setForm((atual) => (atual && atual.id === membro.id ? atual : membro))
  }, [membro])

  if (!membroId || !membro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ficha de membro não encontrada para esta conta.
        </CardContent>
      </Card>
    )
  }

  const atual = form ?? membro

  function set<K extends keyof Membro>(chave: K, valor: Membro[K]) {
    setForm({ ...atual, [chave]: valor })
  }

  async function salvar() {
    setSalvando(true)
    await updateMembro(membro!.id, {
      nome: atual.nome,
      telefone: atual.telefone,
      email: atual.email,
      ministerio: atual.ministerio,
      nascimento: atual.nascimento,
      batizadoEm: atual.batizadoEm,
      ativo: atual.ativo,
    })
    setSalvando(false)
    toast.success('Dados salvos.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {CAMPOS.map((c) => (
          <div key={c.chave} className="space-y-1.5">
            <Label htmlFor={`m-${c.chave}`}>{c.label}</Label>
            <Input
              id={`m-${c.chave}`}
              type={c.tipo ?? 'text'}
              placeholder={c.placeholder}
              value={String(atual[c.chave] ?? '')}
              onChange={(e) => set(c.chave, e.target.value as Membro[typeof c.chave])}
            />
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <span className="text-sm font-medium">Membro ativo</span>
          <Switch checked={atual.ativo} onCheckedChange={(v) => set('ativo', v)} />
        </div>

        <Button className="w-full" onClick={salvar} disabled={salvando}>
          <Save />
          {salvando ? 'Salvando…' : 'Salvar dados'}
        </Button>
      </CardContent>
    </Card>
  )
}
