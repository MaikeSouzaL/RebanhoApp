import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { tabsForRole } from '@/app/nav'
import { useSession } from '@/store/session'

export function BottomNav() {
  const papel = useSession((s) => s.user?.papel)
  const tabs = tabsForRole(papel)
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-lg">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-all',
                    isActive && 'bg-primary/12',
                  )}
                >
                  <tab.icon className={cn('size-5 transition-transform', isActive && 'scale-110')} />
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
