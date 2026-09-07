import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { MoreSheet } from './more-sheet'
import { QuickAdd } from './quick-add'
import { SideNav } from './side-nav'
import { useSession } from '@/store/session'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const papel = useSession((s) => s.papelAtivo)
  // O FAB de ação rápida (novo lançamento) aparece só na tela inicial.
  const showFab = (papel === 'tesoureiro' || papel === 'pastor') && location.pathname === '/'

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop: barra lateral fixa. Celular: barra superior + inferior. */}
      <SideNav />
      <div className="lg:hidden">
        <TopBar onMenu={() => setMenuOpen(true)} />
      </div>

      {/* No desktop o conteúdo abre espaço para a barra lateral e respira mais. */}
      <main className="mx-auto max-w-md px-4 pb-28 pt-4 lg:max-w-4xl lg:px-8 lg:pb-12 lg:pl-72 lg:pt-8">
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
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <MoreSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  )
}
