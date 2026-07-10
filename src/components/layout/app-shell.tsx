import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { MoreSheet } from './more-sheet'
import { QuickAdd } from './quick-add'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { useSession } from '@/store/session'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const papel = useSession((s) => s.user?.papel)
  // O FAB de ação rápida é do tesoureiro, mas não nas telas de formulário (redundante).
  const isForm = /^\/(novo|editar|culto)/.test(location.pathname)
  const showFab = papel === 'tesoureiro' && !isForm

  return (
    <div className="min-h-dvh bg-background">
      <TopBar onMenu={() => setMenuOpen(true)} />

      <main className="mx-auto max-w-md px-4 pb-28 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {showFab && <QuickAdd />}
      <BottomNav />
      <InstallPrompt />
      <MoreSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  )
}
