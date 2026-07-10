import { Menu } from 'lucide-react'
import { Wordmark } from '@/components/brand/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from '@/store/session'
import { initials } from '@/lib/format'

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const user = useSession((s) => s.user)
  return (
    <header className="pt-safe glass sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <Wordmark compact />
        <button
          onClick={onMenu}
          className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 shadow-sm active:scale-[0.98]"
          aria-label="Abrir menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-[11px]">{initials(user?.nome ?? 'P')}</AvatarFallback>
          </Avatar>
          <Menu className="size-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
