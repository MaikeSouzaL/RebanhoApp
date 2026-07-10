import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Formata número como moeda BRL. */
export function formatBRL(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Formata sem o símbolo (para inputs). */
export function formatNumberBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? parseISO(d) : d
}

/** 09/07/2026 */
export function formatDate(d: string | Date): string {
  return format(toDate(d), 'dd/MM/yyyy', { locale: ptBR })
}

/** 9 de jul. de 2026 */
export function formatDateLong(d: string | Date): string {
  return format(toDate(d), "d 'de' MMM 'de' yyyy", { locale: ptBR })
}

/** 09/07/2026 14:32 */
export function formatDateTime(d: string | Date): string {
  return format(toDate(d), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

/** julho de 2026 (competência) */
export function formatCompetencia(competencia: string): string {
  // competencia no formato "YYYY-MM"
  const [y, m] = competencia.split('-').map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  return format(d, "MMMM 'de' yyyy", { locale: ptBR })
}

/** jul/26 */
export function formatMonthShort(competencia: string): string {
  const [y, m] = competencia.split('-').map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  return format(d, 'MMM/yy', { locale: ptBR })
}

/** Iniciais para avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** +12,4% / −3,1% */
export function formatDelta(ratio: number): string {
  const sign = ratio > 0 ? '+' : ratio < 0 ? '−' : ''
  return `${sign}${Math.abs(ratio * 100).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })}%`
}

/** Percentual simples: 42% */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toLocaleString('pt-BR', {
    maximumFractionDigits: digits,
  })}%`
}

/** Primeiro nome. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
