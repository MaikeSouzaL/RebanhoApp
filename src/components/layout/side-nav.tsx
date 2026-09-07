import { NavLink } from 'react-router-dom'
import { Download, Eye, LogOut, Moon, ShieldCheck, Sun, UserRound, Wallet } from 'lucide-react'
import { menuLinksForRole, tabsForRole, type NavItem } from '@/app/nav'
import { useSession } from '@/store/session'
import { Emblem } from '@/components/brand/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { appInstalado, pedirInstalacao } from '@/components/shared/install-prompt'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { Papel } from '@/data/types'

/**
 * Navegação lateral — a "versão desktop" do app.
 *
 * No celular a navegação vive na barra inferior + no menu; em telas largas
 * isso viraria uma coluna estreita perdida no meio. Aqui reunimos os mesmos
 * destinos numa barra fixa à esquerda, que só aparece a partir de `lg`.
 */
export function SideNav() {
  const { user, theme, setTheme, logout, ehDono, papeisDisponiveis, papelAtivo, entrarComoPapel } =
    useSession()
  const principais = tabsForRole(papelAtivo)
  const secundarios = menuLinksForRole(papelAtivo)
  const podeTrocar = ehDono || papeisDisponiveis.length > 1

  return (
    <aside className="pt-safe pb-safe fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <Emblem size={40} className="ring-1 ring-border" />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight">O Rebanho</p>
          <p className="text-[11px] font-medium text-muted-foreground">de Jesus Cristo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {principais.map((item) => (
          <ItemLateral key={item.to} item={item} />
        ))}
        <div className="my-2 h-px bg-border" />
        {secundarios.map((item) => (
          <ItemLateral key={item.to} item={item} />
        ))}
      </nav>

      {podeTrocar && (
        <div className="px-3 pb-2">
          <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Eye className="size-3.5" />
            {ehDono ? 'Modo visualização' : 'Entrar como'}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {papeisDisponiveis.map((papel) => (
              <BotaoPapel
                key={papel}
                papel={papel}
                ativo={papelAtivo === papel}
                onClick={() => entrarComoPapel(papel)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-border p-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
        >
          {theme === 'dark' ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-primary" />}
          Tema {theme === 'dark' ? 'escuro' : 'claro'}
        </button>

        {!appInstalado() && (
          <button
            onClick={pedirInstalacao}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-primary transition hover:bg-accent"
          >
            <Download className="size-4" />
            Instalar o app
          </button>
        )}

        <div className="flex items-center gap-2.5 rounded-xl bg-secondary p-2.5">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">{initials(user?.nome ?? 'U')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.nome}</p>
            <p className="truncate text-[11px] capitalize text-muted-foreground">
              {user?.papel === 'irmao' ? 'membro' : user?.papel}
            </p>
          </div>
          <button
            onClick={() => void logout()}
            aria-label="Sair"
            className="rounded-lg p-1.5 text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function ItemLateral({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-primary/12 text-primary' : 'text-foreground/80 hover:bg-accent',
        )
      }
    >
      <item.icon className="size-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

const META_PAPEL: Record<Papel, { label: string; icon: LucideIcon }> = {
  pastor: { label: 'Pastor', icon: ShieldCheck },
  tesoureiro: { label: 'Tesoureiro', icon: Wallet },
  irmao: { label: 'Membro', icon: UserRound },
}

function BotaoPapel({
  papel,
  ativo,
  onClick,
}: {
  papel: Papel
  ativo: boolean
  onClick: () => void
}) {
  const meta = META_PAPEL[papel]
  const Icone = meta.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] font-semibold transition',
        ativo ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent',
      )}
    >
      <Icone className="size-4" />
      {meta.label}
    </button>
  )
}
