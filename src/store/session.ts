import { create } from 'zustand'
import { db } from '@/data/db'
import type { Papel, Usuario } from '@/data/types'
import { getStoredTheme, setTheme as applyStoredTheme, type Theme } from '@/lib/theme'
import { monthPeriod, type Period } from '@/lib/report'

const USER_KEY = 'rebanho-user'

function loadUser(): Usuario | null {
  const id = localStorage.getItem(USER_KEY)
  if (!id) return null
  return db.usuarios.find((u) => u.id === id) ?? null
}

interface SessionState {
  user: Usuario | null
  theme: Theme
  period: Period

  login: (email: string, senha: string) => { ok: boolean; erro?: string }
  loginAs: (papel: Papel) => void
  logout: () => void
  setTheme: (t: Theme) => void
  setPeriod: (p: Period) => void
}

export const useSession = create<SessionState>((set) => ({
  user: loadUser(),
  theme: getStoredTheme() ?? 'light',
  period: monthPeriod(),

  login: (email, senha) => {
    const user = db.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) return { ok: false, erro: 'E-mail não encontrado.' }
    if (user.senha !== senha) return { ok: false, erro: 'Senha incorreta.' }
    localStorage.setItem(USER_KEY, user.id)
    set({ user })
    return { ok: true }
  },

  loginAs: (papel) => {
    const user = db.usuarios.find((u) => u.papel === papel)
    if (user) {
      localStorage.setItem(USER_KEY, user.id)
      set({ user })
    }
  },

  logout: () => {
    localStorage.removeItem(USER_KEY)
    set({ user: null })
  },

  setTheme: (t) => {
    applyStoredTheme(t)
    set({ theme: t })
  },

  setPeriod: (p) => set({ period: p }),
}))
