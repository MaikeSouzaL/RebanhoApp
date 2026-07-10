import { nanoid } from 'nanoid'
import { clone, db, resetDb, saveDb } from './db'
import type {
  ConfigIgreja,
  ContaPagar,
  Database,
  Entrada,
  Relatorio,
  Saida,
} from './types'

/**
 * Camada de serviços (mock). É o único ponto que toca o "banco".
 * Trocar estas funções por chamadas a uma API/Supabase NÃO exige reescrever a UI.
 */

function competenciaDe(dataIso: string): string {
  return dataIso.slice(0, 7)
}

export const services = {
  snapshot(): Database {
    return clone(db)
  },

  // ---------- Entradas ----------
  addEntrada(input: Omit<Entrada, 'id' | 'competencia'>): Entrada {
    const entrada: Entrada = { ...input, id: `e-${nanoid(8)}`, competencia: competenciaDe(input.data) }
    db.entradas.push(entrada)
    saveDb()
    return clone(entrada)
  },
  removeEntrada(id: string) {
    const i = db.entradas.findIndex((e) => e.id === id)
    if (i >= 0) db.entradas.splice(i, 1)
    saveDb()
  },

  // ---------- Saídas ----------
  addSaida(input: Omit<Saida, 'id' | 'competencia'>): Saida {
    const saida: Saida = { ...input, id: `s-${nanoid(8)}`, competencia: competenciaDe(input.data) }
    db.saidas.push(saida)
    saveDb()
    return clone(saida)
  },
  removeSaida(id: string) {
    const i = db.saidas.findIndex((s) => s.id === id)
    if (i >= 0) db.saidas.splice(i, 1)
    saveDb()
  },

  // ---------- Contas a pagar ----------
  addConta(input: Omit<ContaPagar, 'id'>): ContaPagar {
    const conta: ContaPagar = { ...input, id: `c-${nanoid(8)}` }
    db.contasPagar.push(conta)
    saveDb()
    return clone(conta)
  },
  updateConta(id: string, patch: Partial<ContaPagar>) {
    const conta = db.contasPagar.find((c) => c.id === id)
    if (conta) Object.assign(conta, patch)
    saveDb()
    return conta ? clone(conta) : null
  },
  /** Marca uma conta como paga e gera a saída correspondente. */
  pagarConta(id: string, dataPagamento: string): { conta: ContaPagar; saida: Saida } | null {
    const conta = db.contasPagar.find((c) => c.id === id)
    if (!conta) return null
    const saida = services.addSaida({
      categoria: conta.categoria,
      descricao: conta.descricao,
      fornecedor: conta.fornecedor,
      valor: conta.valor,
      data: dataPagamento,
      forma: 'pix',
      fundoId: conta.fundoId,
      comprovante: true,
    })
    conta.status = 'pago'
    conta.pagoEm = dataPagamento
    conta.saidaId = saida.id
    saveDb()
    return { conta: clone(conta), saida }
  },

  // ---------- Config ----------
  saveConfig(patch: Partial<ConfigIgreja>) {
    Object.assign(db.config, patch)
    saveDb()
    return clone(db.config)
  },

  // ---------- Relatórios ----------
  addRelatorio(input: Omit<Relatorio, 'id' | 'geradoEm'>): Relatorio {
    const rel: Relatorio = { ...input, id: `r-${nanoid(8)}`, geradoEm: new Date().toISOString() }
    db.relatorios.unshift(rel)
    saveDb()
    return clone(rel)
  },

  reset() {
    resetDb()
  },
}
