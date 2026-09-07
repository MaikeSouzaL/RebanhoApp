import { supabase } from '@/lib/supabase'
import {
  contaParaLinha,
  entradaParaLinha,
  membroParaLinha,
  configParaLinha,
  papelParaBanco,
  saidaParaLinha,
} from './api'
import { normalizarPapeis } from '@/lib/papeis'
import type {
  AcaoAudit,
  ConfigIgreja,
  ContaPagar,
  Entrada,
  Fundo,
  Membro,
  Papel,
  Relatorio,
  Saida,
} from './types'

/**
 * Camada de serviços: tudo o que escreve no banco passa por aqui.
 *
 * Diferente da versão P2P, agora não existe "aplicar localmente e torcer": a
 * escrita vai ao Postgres e as regras de permissão (RLS) decidem lá. Se a
 * pessoa não pode, a operação falha — e falha alto, com mensagem.
 */

function erro(acao: string, e: { message: string } | null): never {
  const msg = e?.message ?? 'erro desconhecido'
  // Mensagem do Postgres quando o RLS barra a operação.
  if (/row-level security|permission denied/i.test(msg)) {
    throw new Error(`Você não tem permissão para ${acao}.`)
  }
  throw new Error(`Não foi possível ${acao}: ${msg}`)
}

// ---- Auditoria ----
let auditUser = 'Sistema'
export function setAuditUser(nome: string) {
  auditUser = nome
}

/** Registra o rastro da ação. Nunca derruba a operação principal se falhar. */
async function auditar(
  acao: AcaoAudit,
  entidade: string,
  descricao: string,
  valor?: number,
): Promise<void> {
  try {
    await supabase.from('auditoria').insert({
      usuario: auditUser,
      acao,
      entidade,
      descricao,
      valor: valor ?? null,
    })
  } catch {
    /* o diário é secundário — não vale perder o lançamento por causa dele */
  }
}

const rotuloEntrada = (tipo: Entrada['tipo']) =>
  tipo === 'dizimo' ? 'dízimo' : tipo === 'oferta' ? 'oferta' : 'entrada'

export const services = {
  // ---------- Entradas ----------
  async addEntrada(input: Omit<Entrada, 'id' | 'competencia'>): Promise<Entrada> {
    const { data, error } = await supabase
      .from('entradas')
      .insert(entradaParaLinha(input))
      .select()
      .single()
    if (error) erro('registrar a entrada', error)
    void auditar('criou', rotuloEntrada(input.tipo), input.subtipo ?? '', input.valor)
    return { ...input, id: String(data.id), competencia: String(data.competencia) }
  },

  async updateEntrada(id: string, patch: Partial<Entrada>): Promise<void> {
    const { error } = await supabase.from('entradas').update(entradaParaLinha(patch)).eq('id', id)
    if (error) erro('editar a entrada', error)
    void auditar('editou', 'entrada', patch.subtipo ?? '', patch.valor)
  },

  async removeEntrada(id: string): Promise<void> {
    const { error } = await supabase.from('entradas').delete().eq('id', id)
    if (error) erro('excluir a entrada', error)
    void auditar('excluiu', 'entrada', '')
  },

  // ---------- Saídas ----------
  async addSaida(input: Omit<Saida, 'id' | 'competencia'>): Promise<Saida> {
    const { data, error } = await supabase
      .from('saidas')
      .insert(saidaParaLinha(input))
      .select()
      .single()
    if (error) erro('registrar a despesa', error)
    void auditar('criou', 'despesa', input.descricao, input.valor)
    return { ...input, id: String(data.id), competencia: String(data.competencia) }
  },

  async updateSaida(id: string, patch: Partial<Saida>): Promise<void> {
    const { error } = await supabase.from('saidas').update(saidaParaLinha(patch)).eq('id', id)
    if (error) erro('editar a despesa', error)
    void auditar('editou', 'despesa', patch.descricao ?? '', patch.valor)
  },

  async removeSaida(id: string): Promise<void> {
    const { error } = await supabase.from('saidas').delete().eq('id', id)
    if (error) erro('excluir a despesa', error)
    void auditar('excluiu', 'despesa', '')
  },

  // ---------- Contas a pagar ----------
  async addConta(input: Omit<ContaPagar, 'id'>): Promise<void> {
    const { error } = await supabase.from('contas_pagar').insert(contaParaLinha(input))
    if (error) erro('criar a conta', error)
    void auditar('criou', 'conta a pagar', input.descricao, input.valor)
  },

  async updateConta(id: string, patch: Partial<ContaPagar>): Promise<void> {
    const { error } = await supabase.from('contas_pagar').update(contaParaLinha(patch)).eq('id', id)
    if (error) erro('editar a conta', error)
    void auditar('editou', 'conta a pagar', patch.descricao ?? '', patch.valor)
  },

  /** Marca a conta como paga e gera a despesa correspondente. */
  async pagarConta(id: string, dataPagamento: string): Promise<void> {
    const { data: conta, error: e1 } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('id', id)
      .single()
    if (e1) erro('encontrar a conta', e1)

    const saida = await services.addSaida({
      categoria: conta.categoria,
      descricao: conta.descricao,
      fornecedor: conta.fornecedor ?? undefined,
      valor: Number(conta.valor),
      data: dataPagamento,
      forma: 'pix',
      fundoId: conta.fundo_id ?? '',
      comprovante: true,
    })

    const { error: e2 } = await supabase
      .from('contas_pagar')
      .update({ status: 'pago', pago_em: dataPagamento, saida_id: saida.id })
      .eq('id', id)
    if (e2) erro('baixar a conta', e2)
    void auditar('pagou', 'conta a pagar', conta.descricao, Number(conta.valor))
  },

  // ---------- Membros ----------
  async addMembro(input: Omit<Membro, 'id'>): Promise<void> {
    const { error } = await supabase.from('membros').insert(membroParaLinha(input))
    if (error) erro('cadastrar o membro', error)
    void auditar('criou', 'membro', input.nome)
  },

  async updateMembro(id: string, patch: Partial<Membro>): Promise<void> {
    const { error } = await supabase.from('membros').update(membroParaLinha(patch)).eq('id', id)
    if (error) erro('editar o membro', error)
    void auditar('editou', 'membro', patch.nome ?? '')
  },

  async removeMembro(id: string): Promise<void> {
    const { error } = await supabase.from('membros').delete().eq('id', id)
    if (error) erro('excluir o membro', error)
    void auditar('excluiu', 'membro', '')
  },

  // ---------- Fundos ----------
  async addFundo(input: Omit<Fundo, 'id'>): Promise<void> {
    const { error } = await supabase.from('fundos').insert({
      nome: input.nome,
      descricao: input.descricao,
      cor: input.cor,
      meta: input.meta ?? null,
    })
    if (error) erro('criar o fundo', error)
    void auditar('criou', 'fundo', input.nome)
  },

  async updateFundo(id: string, patch: Partial<Fundo>): Promise<void> {
    const { error } = await supabase
      .from('fundos')
      .update({
        ...(patch.nome !== undefined ? { nome: patch.nome } : {}),
        ...(patch.descricao !== undefined ? { descricao: patch.descricao } : {}),
        ...(patch.cor !== undefined ? { cor: patch.cor } : {}),
        ...(patch.meta !== undefined ? { meta: patch.meta ?? null } : {}),
      })
      .eq('id', id)
    if (error) erro('editar o fundo', error)
    void auditar('editou', 'fundo', patch.nome ?? '')
  },

  // ---------- Usuários, papéis e cargo ----------
  /**
   * Troca os papéis de alguém. Só o pastor consegue: o banco recusa a escrita
   * de qualquer outro, e um gatilho impede a igreja de ficar sem pastor.
   */
  async definirPapeis(usuarioId: string, papeis: Papel[], cargo?: string): Promise<void> {
    const alvo = normalizarPapeis(papeis).map(papelParaBanco)

    // Aplica só a diferença — nunca apaga um papel que vai continuar. Apagar
    // tudo e reinserir esbarraria no gatilho que impede remover o último
    // pastor, quebrando a edição do próprio pastor.
    const { data: atuaisRows, error: e0 } = await supabase
      .from('user_roles')
      .select('papel')
      .eq('user_id', usuarioId)
    if (e0) erro('ler os acessos', e0)

    const atuais = new Set((atuaisRows ?? []).map((r) => String(r.papel)))
    const alvoSet = new Set(alvo)
    const adicionar = alvo.filter((p) => !atuais.has(p))
    const remover = [...atuais].filter((p) => !alvoSet.has(p))

    // Adiciona antes de remover, para nunca passar por um estado sem pastor.
    if (adicionar.length) {
      const { error } = await supabase
        .from('user_roles')
        .insert(adicionar.map((papel) => ({ user_id: usuarioId, papel })))
      if (error) erro('alterar os acessos', error)
    }
    if (remover.length) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', usuarioId)
        .in('papel', remover)
      if (error) erro('alterar os acessos', error)
    }

    if (cargo !== undefined) {
      const { error } = await supabase
        .from('profiles')
        .update({ cargo: cargo.trim() || 'Membro' })
        .eq('id', usuarioId)
      if (error) erro('definir o cargo', error)
    }
    void auditar('editou', 'usuário', `acessos: ${alvo.join(' + ')}`)
  },

  async updatePerfil(id: string, patch: { nome?: string; cargo?: string }): Promise<void> {
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) erro('editar o perfil', error)
  },

  // ---------- Config ----------
  async saveConfig(patch: Partial<ConfigIgreja>): Promise<void> {
    const { error } = await supabase
      .from('config_igreja')
      .update(configParaLinha(patch))
      .eq('id', true)
    if (error) erro('salvar os dados da igreja', error)
    void auditar('editou', 'configurações', 'dados da igreja')
  },

  // ---------- Relatórios ----------
  async addRelatorio(input: Omit<Relatorio, 'id' | 'geradoEm'>): Promise<void> {
    const { error } = await supabase.from('relatorios').insert({
      titulo: input.titulo,
      tipo: input.tipo,
      periodo_inicio: input.periodoInicio,
      periodo_fim: input.periodoFim,
      gerado_por: input.geradoPor,
    })
    if (error) erro('salvar o relatório', error)
    void auditar('gerou', 'relatório', input.titulo)
  },
}
