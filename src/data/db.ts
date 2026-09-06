import { bancoVazio } from '@/sync/oplog'
import { estadoAtual, inscrever } from '@/sync/motor'
import type { Database } from './types'

/**
 * A visão materializada do banco.
 *
 * Não é mais a fonte da verdade: quem manda é o log de operações em
 * `@/sync/motor`. Este objeto é a projeção dele, atualizada *no lugar* para
 * que os módulos que já importavam `db` continuem enxergando o dado atual.
 */
export const db: Database = bancoVazio()

function aplicar(novo: Database) {
  db.config = novo.config
  db.usuarios = novo.usuarios
  db.membros = novo.membros
  db.fundos = novo.fundos
  db.entradas = novo.entradas
  db.saidas = novo.saidas
  db.contasPagar = novo.contasPagar
  db.relatorios = novo.relatorios
  db.auditoria = novo.auditoria
}

aplicar(estadoAtual().db)
inscrever((e) => aplicar(e.db))

/** Clona para evitar mutação acidental do banco a partir da interface. */
export function clone<T>(value: T): T {
  return structuredClone(value)
}

/** Simula latência de rede para estados de loading realistas. */
export function delay<T>(value: T, ms = 140): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
