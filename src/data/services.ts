import { nanoid } from 'nanoid'
import { clone, db } from './db'
import * as motor from '@/sync/motor'
import { normalizarPapeis, papelPrincipal } from '@/sync/dono'
import type { Colecao } from '@/sync/types'
import type {
  AcaoAudit,
  ConfigIgreja,
  ContaPagar,
  Database,
  Entrada,
  Fundo,
  Membro,
  Papel,
  Relatorio,
  Saida,
  Usuario,
} from './types'

/**
 * Camada de serviços. É o único ponto que escreve no banco.
 *
 * Cada função aqui vira uma operação assinada no log (`@/sync/motor`), que é
 * aplicada na hora neste aparelho e replicada para os outros quando houver
 * rede. Do ponto de vista das telas nada mudou: continuam chamando e lendo o
 * resultado imediatamente.
 */

function competenciaDe(dataIso: string): string {
  return dataIso.slice(0, 7)
}

// ---- Auditoria ----
let auditUser = 'Sistema'
export function setAuditUser(nome: string) {
  auditUser = nome
}

function entradaDeAuditoria(acao: AcaoAudit, entidade: string, descricao: string, valor?: number) {
  return {
    id: `a-${nanoid(8)}`,
    ts: new Date().toISOString(),
    usuario: auditUser,
    acao,
    entidade,
    descricao,
    valor,
  }
}

/** Grava um registro e o rastro correspondente no diário, num lote só. */
function gravarCom(
  col: Colecao,
  key: string,
  val: unknown,
  acao: AcaoAudit,
  entidade: string,
  descricao: string,
  valor?: number,
): boolean {
  const rastro = entradaDeAuditoria(acao, entidade, descricao, valor)
  return motor.gravarLote([
    { col, key, val },
    { col: 'auditoria', key: rastro.id, val: rastro },
  ])
}

function excluirCom(
  col: Colecao,
  key: string,
  acao: AcaoAudit,
  entidade: string,
  descricao: string,
  valor?: number,
): boolean {
  const rastro = entradaDeAuditoria(acao, entidade, descricao, valor)
  motor.gravar('auditoria', rastro.id, rastro)
  return motor.excluir(col, key)
}

const rotuloEntrada = (tipo: Entrada['tipo']) =>
  tipo === 'dizimo' ? 'dízimo' : tipo === 'oferta' ? 'oferta' : 'entrada'

export const services = {
  snapshot(): Database {
    return clone(db)
  },

  // ---------- Entradas ----------
  addEntrada(input: Omit<Entrada, 'id' | 'competencia'>): Entrada {
    const entrada: Entrada = {
      ...input,
      id: `e-${nanoid(8)}`,
      competencia: competenciaDe(input.data),
    }
    gravarCom(
      'entradas',
      entrada.id,
      entrada,
      'criou',
      rotuloEntrada(entrada.tipo),
      entrada.subtipo ?? '',
      entrada.valor,
    )
    return clone(entrada)
  },
  updateEntrada(id: string, patch: Partial<Entrada>): Entrada | null {
    const atual = db.entradas.find((x) => x.id === id)
    if (!atual) return null
    const entrada: Entrada = { ...atual, ...patch }
    if (patch.data) entrada.competencia = competenciaDe(patch.data)
    gravarCom(
      'entradas',
      id,
      entrada,
      'editou',
      rotuloEntrada(entrada.tipo),
      entrada.subtipo ?? '',
      entrada.valor,
    )
    return clone(entrada)
  },
  removeEntrada(id: string) {
    const atual = db.entradas.find((x) => x.id === id)
    if (!atual) return
    excluirCom('entradas', id, 'excluiu', rotuloEntrada(atual.tipo), atual.subtipo ?? '', atual.valor)
  },

  // ---------- Saídas ----------
  addSaida(input: Omit<Saida, 'id' | 'competencia'>): Saida {
    const saida: Saida = { ...input, id: `s-${nanoid(8)}`, competencia: competenciaDe(input.data) }
    gravarCom('saidas', saida.id, saida, 'criou', 'despesa', saida.descricao, saida.valor)
    return clone(saida)
  },
  updateSaida(id: string, patch: Partial<Saida>): Saida | null {
    const atual = db.saidas.find((x) => x.id === id)
    if (!atual) return null
    const saida: Saida = { ...atual, ...patch }
    if (patch.data) saida.competencia = competenciaDe(patch.data)
    gravarCom('saidas', id, saida, 'editou', 'despesa', saida.descricao, saida.valor)
    return clone(saida)
  },
  removeSaida(id: string) {
    const atual = db.saidas.find((x) => x.id === id)
    if (!atual) return
    excluirCom('saidas', id, 'excluiu', 'despesa', atual.descricao, atual.valor)
  },

  // ---------- Contas a pagar ----------
  addConta(input: Omit<ContaPagar, 'id'>): ContaPagar {
    const conta: ContaPagar = { ...input, id: `c-${nanoid(8)}` }
    gravarCom('contasPagar', conta.id, conta, 'criou', 'conta a pagar', conta.descricao, conta.valor)
    return clone(conta)
  },
  updateConta(id: string, patch: Partial<ContaPagar>): ContaPagar | null {
    const atual = db.contasPagar.find((c) => c.id === id)
    if (!atual) return null
    const conta: ContaPagar = { ...atual, ...patch }
    gravarCom('contasPagar', id, conta, 'editou', 'conta a pagar', conta.descricao, conta.valor)
    return clone(conta)
  },
  /** Marca uma conta como paga e gera a saída correspondente. */
  pagarConta(id: string, dataPagamento: string): { conta: ContaPagar; saida: Saida } | null {
    const atual = db.contasPagar.find((c) => c.id === id)
    if (!atual) return null
    const saida = services.addSaida({
      categoria: atual.categoria,
      descricao: atual.descricao,
      fornecedor: atual.fornecedor,
      valor: atual.valor,
      data: dataPagamento,
      forma: 'pix',
      fundoId: atual.fundoId,
      comprovante: true,
    })
    const conta: ContaPagar = { ...atual, status: 'pago', pagoEm: dataPagamento, saidaId: saida.id }
    gravarCom('contasPagar', id, conta, 'pagou', 'conta a pagar', conta.descricao, conta.valor)
    return { conta: clone(conta), saida }
  },

  // ---------- Membros ----------
  addMembro(input: Omit<Membro, 'id'>): Membro {
    const membro: Membro = { ...input, id: `m-${nanoid(8)}` }
    gravarCom('membros', membro.id, membro, 'criou', 'membro', membro.nome)
    return clone(membro)
  },
  updateMembro(id: string, patch: Partial<Membro>): Membro | null {
    const atual = db.membros.find((m) => m.id === id)
    if (!atual) return null
    const membro: Membro = { ...atual, ...patch }
    gravarCom('membros', id, membro, 'editou', 'membro', membro.nome)
    return clone(membro)
  },
  removeMembro(id: string) {
    const atual = db.membros.find((m) => m.id === id)
    if (!atual) return
    excluirCom('membros', id, 'excluiu', 'membro', atual.nome)
  },

  // ---------- Fundos ----------
  addFundo(input: Omit<Fundo, 'id'>): Fundo {
    const fundo: Fundo = { ...input, id: `f-${nanoid(6)}` }
    gravarCom('fundos', fundo.id, fundo, 'criou', 'fundo', fundo.nome)
    return clone(fundo)
  },
  updateFundo(id: string, patch: Partial<Fundo>): Fundo | null {
    const atual = db.fundos.find((f) => f.id === id)
    if (!atual) return null
    const fundo: Fundo = { ...atual, ...patch }
    gravarCom('fundos', id, fundo, 'editou', 'fundo', fundo.nome)
    return clone(fundo)
  },

  // ---------- Usuários e papéis ----------
  /**
   * Só o pastor consegue mudar papéis: a operação vai assinada e os outros
   * aparelhos recusam a mudança se a assinatura não for de um pastor. Um
   * usuário pode receber mais de um papel (pastor E tesoureiro, por exemplo).
   */
  definirPapeis(usuarioId: string, papeis: Papel[], cargo?: string): Usuario | null {
    const atual = db.usuarios.find((u) => u.id === usuarioId)
    if (!atual) return null
    const norm = normalizarPapeis(papeis)
    const usuario: Usuario = {
      ...atual,
      papeis: norm,
      papel: papelPrincipal(norm),
      cargo: cargo?.trim() || atual.cargo,
    }
    const nomes = norm.map((p) => (p === 'pastor' ? 'pastor' : p === 'tesoureiro' ? 'tesoureiro' : 'membro'))
    gravarCom('usuarios', usuarioId, usuario, 'editou', 'usuário', `${atual.nome}: ${nomes.join(' + ')}`)
    return clone(usuario)
  },
  updateUsuario(id: string, patch: Partial<Usuario>): Usuario | null {
    const atual = db.usuarios.find((u) => u.id === id)
    if (!atual) return null
    const usuario: Usuario = { ...atual, ...patch }
    gravarCom('usuarios', id, usuario, 'editou', 'usuário', usuario.nome)
    return clone(usuario)
  },
  removeUsuario(id: string) {
    const atual = db.usuarios.find((u) => u.id === id)
    if (!atual) return
    excluirCom('usuarios', id, 'excluiu', 'usuário', atual.nome)
  },

  // ---------- Config ----------
  saveConfig(patch: Partial<ConfigIgreja>): ConfigIgreja {
    const config: ConfigIgreja = { ...db.config, ...patch }
    gravarCom('config', 'igreja', config, 'editou', 'configurações', 'dados da igreja')
    return clone(config)
  },

  // ---------- Relatórios ----------
  addRelatorio(input: Omit<Relatorio, 'id' | 'geradoEm'>): Relatorio {
    const rel: Relatorio = { ...input, id: `r-${nanoid(8)}`, geradoEm: new Date().toISOString() }
    gravarCom('relatorios', rel.id, rel, 'gerou', 'relatório', rel.titulo)
    return clone(rel)
  },

  // ---------- Backup ----------
  /**
   * Traz de volta um backup em JSON. Cada registro vira uma operação nova, com
   * o horário de agora — então o backup vence o que já estava lá, e a
   * restauração se propaga para os outros aparelhos como qualquer alteração.
   */
  importBackup(data: Database) {
    const itens: { col: Colecao; key: string; val: unknown }[] = []
    if (data.config) itens.push({ col: 'config', key: 'igreja', val: data.config })
    const listas: [Colecao, { id: string }[]][] = [
      ['membros', data.membros ?? []],
      ['fundos', data.fundos ?? []],
      ['entradas', data.entradas ?? []],
      ['saidas', data.saidas ?? []],
      ['contasPagar', data.contasPagar ?? []],
      ['relatorios', data.relatorios ?? []],
    ]
    for (const [col, lista] of listas) {
      for (const item of lista) itens.push({ col, key: item.id, val: item })
    }
    const rastro = entradaDeAuditoria('importou', 'backup', 'dados restaurados de backup')
    itens.push({ col: 'auditoria', key: rastro.id, val: rastro })
    motor.gravarLote(itens)
  },

  /** Apaga o log deste aparelho por completo (cadastros inclusive). */
  async reset() {
    await motor.apagarTudo()
  },
}
