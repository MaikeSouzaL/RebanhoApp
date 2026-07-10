import { useNavigate } from 'react-router-dom'
import {
  Cake,
  ChevronRight,
  HandCoins,
  History,
  LogOut,
  Moon,
  Palette,
  PiggyBank,
  Settings,
  Sun,
  Users,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useSession } from '@/store/session'
import { initials } from '@/lib/format'
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

function linksForRole(papel: Papel | undefined): Link[] {
  if (papel === 'irmao') return [CONTRIBUIR, FUNDOS, CONFIG, STYLE]
  return [MEMBROS, ANIVERSARIOS, FUNDOS, ATIVIDADE, CONFIG, STYLE]
}

export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { user, theme, setTheme, logout } = useSession()
  const links = linksForRole(user?.papel)

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
              <span className="capitalize">{user?.papel}</span> · O Rebanho de Jesus Cristo
            </p>
          </div>
        </div>

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

        <button
          onClick={() => {
            onOpenChange(false)
            logout()
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
