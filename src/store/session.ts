import { create } from 'zustand'
import { db } from '@/data/db'
import { setAuditUser } from '@/data/services'
import type { Papel, Usuario } from '@/data/types'
import { getStoredTheme, setTheme as applyStoredTheme, type Theme } from '@/lib/theme'
import { hasPin, verifyPin } from '@/lib/prefs'
import { monthPeriod, type Period } from '@/lib/report'

const USER_KEY = 'rebanho-user'

function loadUser(): Usuario | null {
  const id = localStorage.getItem(USER_KEY)
  if (!id) return null
  const u = db.usuarios.find((x) => x.id === id) ?? null
  if (u) setAuditUser(u.nome)
  return u
}

interface SessionState {
  user: Usuario | null
  theme: Theme
  period: Period
  locked: boolean

  login: (email: string, senha: string) => { ok: boolean; erro?: string }
  loginAs: (papel: Papel) => void
  logout: () => void
  setTheme: (t: Theme) => void
  setPeriod: (p: Period) => void
  unlock: (pin: string) => boolean
  lock: () => void
}

export const useSession = create<SessionState>((set) => ({
  user: loadUser(),
  theme: getStoredTheme() ?? 'light',
  period: monthPeriod(),
  locked: hasPin(),

  login: (email, senha) => {
    const user = db.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) return { ok: false, erro: 'E-mail não encontrado.' }
    if (user.senha !== senha) return { ok: false, erro: 'Senha incorreta.' }
    localStorage.setItem(USER_KEY, user.id)
    setAuditUser(user.nome)
    set({ user })
    return { ok: true }
  },

  loginAs: (papel) => {
    const user = db.usuarios.find((u) => u.papel === papel)
    if (user) {
      localStorage.setItem(USER_KEY, user.id)
      setAuditUser(user.nome)
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

  unlock: (pin) => {
    if (verifyPin(pin)) {
      set({ locked: false })
      return true
    }
    return false
  },
  lock: () => set({ locked: true }),
}))
