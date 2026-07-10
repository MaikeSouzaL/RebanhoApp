import { createDatabase } from './seed'
import type { Database } from './types'

/**
 * "Banco" mock. Persiste em localStorage para sobreviver a reloads (F5).
 * A versão na chave invalida dados antigos quando o schema muda.
 */
const STORAGE_KEY = 'rebanho-db-v1'

function load(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Database) : null
  } catch {
    return null
  }
}

export const db: Database = load() ?? createDatabase()

/** Salva o estado atual do banco (chamado após cada mutação). */
export function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* quota cheia — segue em memória */
  }
}

/** Restaura os dados de exemplo (botão de reset nas Configurações). */
export function resetDb() {
  const fresh = createDatabase()
  ;(Object.keys(fresh) as (keyof Database)[]).forEach((k) => {
    if (Array.isArray(db[k])) {
      ;(db[k] as unknown[]).splice(0, (db[k] as unknown[]).length, ...(fresh[k] as unknown[]))
    } else {
      ;(db as unknown as Record<string, unknown>)[k] = fresh[k]
    }
  })
  saveDb()
}

// Persiste a semente na primeira visita.
if (!load()) saveDb()

/** Simula latência de rede para estados de loading realistas. */
export function delay<T>(value: T, ms = 140): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/** Clona para evitar mutação acidental do "banco" a partir da UI. */
export function clone<T>(value: T): T {
  return structuredClone(value)
}
