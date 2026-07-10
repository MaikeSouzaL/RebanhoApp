export type Theme = 'light' | 'dark'

const KEY = 'rebanho-theme'

export function getStoredTheme(): Theme | null {
  const t = localStorage.getItem(KEY)
  return t === 'light' || t === 'dark' ? t : null
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F1712' : '#1E7D3A')
}

/** Light-first: usa o tema salvo, senão claro (não segue o SO por padrão). */
export function initTheme() {
  const theme = getStoredTheme() ?? 'light'
  applyTheme(theme)
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme)
  applyTheme(theme)
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  setTheme(next)
  return next
}
