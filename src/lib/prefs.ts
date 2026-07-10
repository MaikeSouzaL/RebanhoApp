// Preferências locais: escala de fonte (acessibilidade) e PIN de acesso.

const FONT_KEY = 'rebanho-fontscale'
export type FontScale = 'normal' | 'grande' | 'maior'
const SCALE: Record<FontScale, number> = { normal: 1, grande: 1.15, maior: 1.3 }

export function getFontScale(): FontScale {
  const v = localStorage.getItem(FONT_KEY)
  return v === 'grande' || v === 'maior' ? v : 'normal'
}
export function applyFontScale(s: FontScale) {
  document.documentElement.style.fontSize = `${SCALE[s] * 100}%`
}
export function setFontScale(s: FontScale) {
  localStorage.setItem(FONT_KEY, s)
  applyFontScale(s)
}

// ---- PIN (armazenamento local, hash simples — não é segurança forte) ----
const PIN_KEY = 'rebanho-pin'

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return String(h >>> 0)
}

export function hasPin(): boolean {
  return !!localStorage.getItem(PIN_KEY)
}
export function setPin(pin: string) {
  localStorage.setItem(PIN_KEY, hash(pin))
}
export function clearPin() {
  localStorage.removeItem(PIN_KEY)
}
export function verifyPin(pin: string): boolean {
  return hasPin() && localStorage.getItem(PIN_KEY) === hash(pin)
}

export function initPrefs() {
  applyFontScale(getFontScale())
}
