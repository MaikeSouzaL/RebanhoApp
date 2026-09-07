import { useNavigate } from 'react-router-dom'
import {
  Cake,
  ChevronRight,
  Download,
  Eye,
  HandCoins,
  History,
  LogOut,
  Moon,
  Palette,
  PiggyBank,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useSession } from '@/store/session'
import { appInstalado, pedirInstalacao } from '@/components/shared/install-prompt'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { Papel } from '@/data/types'

type Link = { to: string; label: string; desc: string; icon: LucideIcon }

const FUNDOS: Link = { to: '/fundos', label: 'Fundos', desc: 'Missões, construção, assistência', icon: PiggyBank }
const CONFIG: Link = { to: '/config', label: 'Configurações', desc: 'Dados da igreja e categorias', icon: Settings }
const STYLE: Link = { to: '/style', label: 'Style Guide', desc: 'Identidade visual do app', icon: Palette }
const MEMBROS: Link = { to: '/membros', label: 'Membros', desc: 'Contribuintes e histórico', icon: Users }
const CONTRIBUIR: Link = { to: '/contribuir', label: 'Contribuir', desc: 'Chave Pix e QR Code', icon: HandCoins }
const ANIVERSARIOS: Link = { to: '/aniversariantes', label: 'Aniversariantes', desc: 'Do mês', icon: Cake }
const ATIVIDADE: Link = { to: '/atividade', label: 'Atividade', desc: 'Histórico de ações', icon: History }
const USUARIOS: Link = { to: '/usuarios', label: 'Usuários', desc: 'Definir pastores e tesoureiros', icon: ShieldCheck }

function linksForRole(papel: Papel | undefined): Link[] {
  if (papel === 'irmao') return [CONTRIBUIR, FUNDOS, CONFIG, STYLE]
  if (papel === 'pastor') return [USUARIOS, MEMBROS, ANIVERSARIOS, FUNDOS, ATIVIDADE, CONFIG, STYLE]
  return [MEMBROS, ANIVERSARIOS, FUNDOS, ATIVIDADE, CONFIG, STYLE]
}

export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { user, theme, setTheme, logout, ehDono, papeisDisponiveis, papelAtivo, entrarComoPapel } =
    useSession()
  const links = linksForRole(papelAtivo)
  // Mostra o seletor quando há mais de um papel (ou para o dono, que vê todos).
  const podeTrocar = ehDono || papeisDisponiveis.length > 1

  function go(to: string) {
    onOpenChange(false)
    navigate(to)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-4">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <Avatar className="size-12">
            <AvatarFallback>{initials(user?.nome ?? 'Pastor')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{user?.nome}</p>
            <p className="text-xs text-muted-foreground">
              <span className="capitalize">{user?.papel === 'irmao' ? 'membro' : user?.papel}</span>
              {user?.cargo && user.cargo !== 'Membro' ? ` · ${user.cargo}` : ''}
            </p>
          </div>
        </div>

        {podeTrocar && (
          <SeletorPapel
            atual={papelAtivo}
            disponiveis={papeisDisponiveis}
            ehDono={ehDono}
            onEscolher={entrarComoPapel}
          />
        )}

        <div className="grid gap-2">
          {links.map((l) => (
            <button
              key={l.to}
              onClick={() => go(l.to)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left active:scale-[0.99]"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <l.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{l.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{l.desc}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <span className="flex items-center gap-2.5 text-sm font-medium">
            {theme === 'dark' ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-primary" />}
            Tema escuro
          </span>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </div>

        {!appInstalado() && (
          <button
            onClick={() => {
              onOpenChange(false)
              pedirInstalacao()
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-sm font-semibold text-primary active:scale-[0.99]"
          >
            <Download className="size-4" />
            Instalar o app
          </button>
        )}

        <button
          onClick={() => {
            onOpenChange(false)
            void logout()
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold text-destructive active:scale-[0.99]"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </SheetContent>
    </Sheet>
  )
}

const META_PAPEL: Record<Papel, { label: string; icon: LucideIcon }> = {
  pastor: { label: 'Pastor', icon: ShieldCheck },
  tesoureiro: { label: 'Tesoureiro', icon: Wallet },
  irmao: { label: 'Membro', icon: Users },
}

/**
 * Seletor de papel. Aparece para quem tem mais de um papel (pastor E
 * tesoureiro, por exemplo) e para o dono, que enxerga todos. Troca por qual
 * papel a interface se comporta, sem mexer no papel real.
 */
function SeletorPapel({
  atual,
  disponiveis,
  ehDono,
  onEscolher,
}: {
  atual: Papel
  disponiveis: Papel[]
  ehDono: boolean
  onEscolher: (papel: Papel) => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
        <Eye className="size-3.5" />
        {ehDono ? 'Modo visualização' : 'Entrar como'}
      </p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${disponiveis.length}, minmax(0, 1fr))` }}
      >
        {disponiveis.map((valor) => {
          const meta = META_PAPEL[valor]
          const Icone = meta.icon
          const ativo = atual === valor
          return (
            <button
              key={valor}
              onClick={() => onEscolher(valor)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition',
                ativo ? 'border-primary bg-card text-primary' : 'border-transparent text-muted-foreground',
              )}
            >
              <Icone className="size-4" />
              {meta.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
