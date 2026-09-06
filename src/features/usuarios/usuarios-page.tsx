import { useMemo, useState } from 'react'
import { Check, Search, ShieldCheck, Trash2, UserRound, Users, Wallet } from 'lucide-react'
import { useData } from '@/store/data'
import { useSession } from '@/store/session'
import { initials } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ehEmailDono, normalizarPapeis, papeisDoUsuario } from '@/sync/dono'
import { CARGOS, cargoDe } from '@/data/cargos'
import { estadoAtual } from '@/sync/motor'
import type { Papel, Usuario } from '@/data/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PAPEIS: { valor: Papel; label: string; icone: typeof ShieldCheck; classe: string }[] = [
  { valor: 'pastor', label: 'Pastor', icone: ShieldCheck, classe: 'text-primary' },
  { valor: 'tesoureiro', label: 'Tesoureiro', icone: Wallet, classe: 'text-info' },
  { valor: 'irmao', label: 'Membro', icone: UserRound, classe: 'text-muted-foreground' },
]

const META_PAPEL: Record<Papel, (typeof PAPEIS)[number]> = {
  pastor: PAPEIS[0]!,
  tesoureiro: PAPEIS[1]!,
  irmao: PAPEIS[2]!,
}

export function UsuariosPage() {
  const { usuarios, definirPapeis, removeUsuario } = useData()
  const eu = useSession((s) => s.user)
  const [busca, setBusca] = useState('')
  const [emEdicao, setEmEdicao] = useState<Usuario | null>(null)
  const [selecao, setSelecao] = useState<Papel[]>([])
  const [cargo, setCargo] = useState<string>('Membro')
  const [paraExcluir, setParaExcluir] = useState<Usuario | null>(null)

  // Quem fundou a igreja é o primeiro cadastro do log; o papel dele é fixo.
  const fundador = estadoAtual().fundador

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const ordem: Record<Papel, number> = { pastor: 0, tesoureiro: 1, irmao: 2 }
    return usuarios
      // A conta de manutenção do dono não aparece para ninguém.
      .filter((u) => !ehEmailDono(u.email))
      .filter((u) => (q ? u.nome.toLowerCase().includes(q) || u.email.includes(q) : true))
      .sort((a, b) => ordem[a.papel] - ordem[b.papel] || a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [usuarios, busca])

  function abrir(usuario: Usuario) {
    setSelecao(papeisDoUsuario(usuario))
    setCargo(cargoDe(usuario.cargo))
    setEmEdicao(usuario)
  }

  /** Liga/desliga um papel na seleção, garantindo ao menos um. */
  function alternar(papel: Papel) {
    setSelecao((atual) => {
      const tem = atual.includes(papel)
      const nova = tem ? atual.filter((p) => p !== papel) : [...atual, papel]
      return nova.length ? nova : atual
    })
  }

  function salvarPapeis() {
    if (!emEdicao) return
    definirPapeis(emEdicao.id, selecao, cargo)
    const nomes = normalizarPapeis(selecao).map((p) => META_PAPEL[p].label)
    setEmEdicao(null)
    toast.success(`${emEdicao.nome}: ${nomes.join(' + ')}.`)
  }

  function excluir(usuario: Usuario) {
    removeUsuario(usuario.id)
    setParaExcluir(null)
    toast.success('Cadastro removido.')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuários"
        subtitle={`${usuarios.length} cadastrados · você define os papéis`}
      />

      <Card className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">
          Peça aos irmãos que abram o app e criem o cadastro — eles entram automaticamente como
          membros. Aqui você promove quem for tesoureiro ou pastor.
        </p>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="pl-9"
        />
      </div>

      {lista.length ? (
        <Card className="divide-y divide-border p-0">
          {lista.map((usuario) => {
            const papeis = papeisDoUsuario(usuario)
            const ehFundador = usuario.id === fundador
            return (
              <button
                key={usuario.id}
                onClick={() => abrir(usuario)}
                className="flex w-full items-center gap-3 p-3.5 text-left active:bg-accent"
              >
                <Avatar className="size-11">
                  <AvatarFallback>{initials(usuario.nome)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {usuario.nome}
                    {usuario.id === eu?.id && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cargoDe(usuario.cargo)} · {usuario.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex flex-wrap justify-end gap-1">
                    {papeis.map((p) => {
                      const meta = META_PAPEL[p]
                      const Icone = meta.icone
                      return (
                        <span
                          key={p}
                          className={cn('flex items-center gap-1 text-xs font-semibold', meta.classe)}
                        >
                          <Icone className="size-3.5" />
                          {meta.label}
                        </span>
                      )
                    })}
                  </span>
                  {ehFundador && <Badge variant="secondary">Fundador</Badge>}
                </div>
              </button>
            )
          })}
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cadastro ainda"
          description="Peça aos irmãos que abram o app e criem o cadastro."
        />
      )}

      {/* Definir acesso (pode acumular papéis) */}
      <Dialog open={!!emEdicao} onOpenChange={(v) => !v && setEmEdicao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{emEdicao?.nome}</DialogTitle>
            <DialogDescription>
              {emEdicao?.id === fundador
                ? 'Fundador da igreja — sempre mantém o acesso de pastor. Pode acumular outros.'
                : 'Marque tudo o que esta pessoa pode fazer. Ela pode ter mais de um acesso e alternar entre eles.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {PAPEIS.map((p) => {
              const Icone = p.icone
              const ativo = selecao.includes(p.valor)
              const travado = emEdicao?.id === fundador && p.valor === 'pastor'
              return (
                <button
                  key={p.valor}
                  disabled={travado}
                  onClick={() => alternar(p.valor)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition',
                    ativo ? 'border-primary bg-primary/5' : 'border-border',
                    travado ? 'opacity-70' : 'active:scale-[0.99]',
                  )}
                >
                  <span className={cn('flex size-9 items-center justify-center rounded-xl bg-secondary', p.classe)}>
                    <Icone className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{descricaoPapel(p.valor)}</span>
                  </span>
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-md border',
                      ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {ativo && <Check className="size-3.5" />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cargo na igreja (título)
            </Label>
            <Select value={cargo} onValueChange={setCargo}>
              <SelectTrigger>
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Só um rótulo mostrado na pessoa — não muda o que ela pode fazer no app.
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={salvarPapeis}>
              <Check />
              Salvar
            </Button>
            {emEdicao && emEdicao.id !== fundador && emEdicao.id !== eu?.id && (
              <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => {
                  setParaExcluir(emEdicao)
                  setEmEdicao(null)
                }}
              >
                <Trash2 />
                Remover cadastro
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!paraExcluir} onOpenChange={(v) => !v && setParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {paraExcluir?.nome}?</DialogTitle>
            <DialogDescription>
              A pessoa perde o acesso em todos os aparelhos assim que eles sincronizarem. Os
              lançamentos que ela registrou continuam no histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => paraExcluir && excluir(paraExcluir)}>
              <Trash2 />
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function descricaoPapel(papel: Papel): string {
  if (papel === 'pastor') return 'Vê tudo, edita a igreja e define papéis.'
  if (papel === 'tesoureiro') return 'Lança entradas, saídas e contas a pagar.'
  return 'Acompanha a prestação de contas e a própria contribuição.'
}
