import { nanoid } from 'nanoid'
import { clone, db, importDb, resetDb, saveDb } from './db'
import type {
  AcaoAudit,
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

// ---- Auditoria ----
let auditUser = 'Sistema'
export function setAuditUser(nome: string) {
  auditUser = nome
}
function audit(acao: AcaoAudit, entidade: string, descricao: string, valor?: number) {
  db.auditoria.unshift({
    id: `a-${nanoid(8)}`,
    ts: new Date().toISOString(),
    usuario: auditUser,
    acao,
    entidade,
    descricao,
    valor,
  })
  if (db.auditoria.length > 300) db.auditoria.length = 300
}

export const services = {
  snapshot(): Database {
    return clone(db)
  },

  // ---------- Entradas ----------
  addEntrada(input: Omit<Entrada, 'id' | 'competencia'>): Entrada {
    const entrada: Entrada = { ...input, id: `e-${nanoid(8)}`, competencia: competenciaDe(input.data) }
    db.entradas.push(entrada)
    audit('criou', input.tipo === 'dizimo' ? 'dízimo' : input.tipo === 'oferta' ? 'oferta' : 'entrada', input.subtipo ?? '', input.valor)
    saveDb()
    return clone(entrada)
  },
  updateEntrada(id: string, patch: Partial<Entrada>): Entrada | null {
    const e = db.entradas.find((x) => x.id === id)
    if (!e) return null
    Object.assign(e, patch)
    if (patch.data) e.competencia = competenciaDe(patch.data)
    audit('editou', e.tipo === 'dizimo' ? 'dízimo' : 'oferta', e.subtipo ?? '', e.valor)
    saveDb()
    return clone(e)
  },
  removeEntrada(id: string) {
    const i = db.entradas.findIndex((e) => e.id === id)
    if (i >= 0) {
      const [rm] = db.entradas.splice(i, 1)
      audit('excluiu', rm!.tipo === 'dizimo' ? 'dízimo' : 'oferta', rm!.subtipo ?? '', rm!.valor)
    }
    saveDb()
  },

  // ---------- Saídas ----------
  addSaida(input: Omit<Saida, 'id' | 'competencia'>): Saida {
    const saida: Saida = { ...input, id: `s-${nanoid(8)}`, competencia: competenciaDe(input.data) }
    db.saidas.push(saida)
    audit('criou', 'despesa', input.descricao, input.valor)
    saveDb()
    return clone(saida)
  },
  updateSaida(id: string, patch: Partial<Saida>): Saida | null {
    const s = db.saidas.find((x) => x.id === id)
    if (!s) return null
    Object.assign(s, patch)
    if (patch.data) s.competencia = competenciaDe(patch.data)
    audit('editou', 'despesa', s.descricao, s.valor)
    saveDb()
    return clone(s)
  },
  removeSaida(id: string) {
    const i = db.saidas.findIndex((s) => s.id === id)
    if (i >= 0) {
      const [rm] = db.saidas.splice(i, 1)
      audit('excluiu', 'despesa', rm!.descricao, rm!.valor)
    }
    saveDb()
  },

  // ---------- Contas a pagar ----------
  addConta(input: Omit<ContaPagar, 'id'>): ContaPagar {
    const conta: ContaPagar = { ...input, id: `c-${nanoid(8)}` }
    db.contasPagar.push(conta)
    audit('criou', 'conta a pagar', input.descricao, input.valor)
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
    audit('pagou', 'conta a pagar', conta.descricao, conta.valor)
    saveDb()
    return { conta: clone(conta), saida }
  },

  // ---------- Config ----------
  saveConfig(patch: Partial<ConfigIgreja>) {
    Object.assign(db.config, patch)
    audit('editou', 'configurações', 'dados da igreja')
    saveDb()
    return clone(db.config)
  },

  // ---------- Relatórios ----------
  addRelatorio(input: Omit<Relatorio, 'id' | 'geradoEm'>): Relatorio {
    const rel: Relatorio = { ...input, id: `r-${nanoid(8)}`, geradoEm: new Date().toISOString() }
    db.relatorios.unshift(rel)
    audit('gerou', 'relatório', rel.titulo)
    saveDb()
    return clone(rel)
  },

  // ---------- Backup ----------
  importBackup(data: Database) {
    importDb(data)
    audit('importou', 'backup', 'dados restaurados de backup')
    saveDb()
  },

  reset() {
    resetDb()
  },
}
