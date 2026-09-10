import { supabase } from '@/lib/supabase'
import type {
  AuditEntry,
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
 * Acesso ao banco (Supabase/Postgres).
 *
 * O Postgres usa snake_case e o app camelCase, então tudo passa por um
 * conversor aqui — é o único lugar que conhece os dois formatos.
 *
 * Nenhuma permissão é decidida neste arquivo: quem manda é o Row Level
 * Security do banco. Se alguém tentar escrever onde não pode, a consulta
 * volta com erro, não com sucesso silencioso.
 */

// ---------- Conversores: linha do banco -> tipo do app ----------

type Linha = Record<string, unknown>

const texto = (v: unknown): string => (v == null ? '' : String(v))
const opcional = (v: unknown): string | undefined => (v == null ? undefined : String(v))
const numero = (v: unknown): number => (v == null ? 0 : Number(v))

function paraMembro(l: Linha): Membro {
  return {
    id: texto(l.id),
    nome: texto(l.nome),
    telefone: opcional(l.telefone),
    email: opcional(l.email),
    ministerio: opcional(l.ministerio),
    batizadoEm: opcional(l.batizado_em),
    nascimento: opcional(l.nascimento),
    ativo: l.ativo !== false,
  }
}

function paraFundo(l: Linha): Fundo {
  return {
    id: texto(l.id),
    nome: texto(l.nome),
    descricao: texto(l.descricao),
    cor: texto(l.cor) || 'var(--chart-1)',
    meta: l.meta == null ? undefined : Number(l.meta),
  }
}

function paraEntrada(l: Linha): Entrada {
  return {
    id: texto(l.id),
    tipo: texto(l.tipo) as Entrada['tipo'],
    subtipo: opcional(l.subtipo),
    valor: numero(l.valor),
    data: texto(l.data),
    competencia: texto(l.competencia),
    forma: texto(l.forma) as Entrada['forma'],
    fundoId: texto(l.fundo_id),
    membroId: l.membro_id == null ? null : texto(l.membro_id),
    origem: l.origem === 'membro' ? 'membro' : 'tesouraria',
    obs: opcional(l.obs),
  }
}

function paraSaida(l: Linha): Saida {
  return {
    id: texto(l.id),
    categoria: texto(l.categoria) as Saida['categoria'],
    descricao: texto(l.descricao),
    fornecedor: opcional(l.fornecedor),
    valor: numero(l.valor),
    data: texto(l.data),
    competencia: texto(l.competencia),
    forma: texto(l.forma) as Saida['forma'],
    fundoId: texto(l.fundo_id),
    comprovante: l.comprovante === true,
    comprovanteUrl: opcional(l.comprovante_url),
    obs: opcional(l.obs),
  }
}

function paraConta(l: Linha): ContaPagar {
  return {
    id: texto(l.id),
    descricao: texto(l.descricao),
    categoria: texto(l.categoria) as ContaPagar['categoria'],
    valor: numero(l.valor),
    vencimento: texto(l.vencimento),
    status: texto(l.status) as ContaPagar['status'],
    recorrencia: texto(l.recorrencia) as ContaPagar['recorrencia'],
    fundoId: texto(l.fundo_id),
    fornecedor: opcional(l.fornecedor),
    pagoEm: opcional(l.pago_em),
    saidaId: opcional(l.saida_id),
  }
}

function paraRelatorio(l: Linha): Relatorio {
  return {
    id: texto(l.id),
    titulo: texto(l.titulo),
    tipo: texto(l.tipo) as Relatorio['tipo'],
    periodoInicio: texto(l.periodo_inicio),
    periodoFim: texto(l.periodo_fim),
    geradoEm: texto(l.gerado_em),
    geradoPor: texto(l.gerado_por),
  }
}

function paraAuditoria(l: Linha): AuditEntry {
  return {
    id: texto(l.id),
    ts: texto(l.ts),
    usuario: texto(l.usuario),
    acao: texto(l.acao) as AuditEntry['acao'],
    entidade: texto(l.entidade),
    descricao: texto(l.descricao),
    valor: l.valor == null ? undefined : Number(l.valor),
  }
}

function paraConfig(l: Linha | null): ConfigIgreja {
  return {
    nome: texto(l?.nome) || 'O Rebanho de Jesus Cristo',
    razaoSocial: texto(l?.razao_social),
    cnpj: texto(l?.cnpj),
    fundacao: texto(l?.fundacao),
    endereco: texto(l?.endereco),
    cidade: texto(l?.cidade),
    pastor: texto(l?.pastor),
    pastorPresidente: texto(l?.pastor_presidente),
    telefone: texto(l?.telefone),
    pixTipo: texto(l?.pix_tipo) || 'CNPJ',
    pixChave: texto(l?.pix_chave),
    orcamento: (l?.orcamento as ConfigIgreja['orcamento']) ?? {},
  }
}

// ---------- Conversores: tipo do app -> linha do banco ----------

export function entradaParaLinha(e: Partial<Entrada>): Linha {
  const l: Linha = {}
  if (e.tipo !== undefined) l.tipo = e.tipo
  if (e.subtipo !== undefined) l.subtipo = e.subtipo
  if (e.valor !== undefined) l.valor = e.valor
  if (e.data !== undefined) l.data = e.data
  if (e.forma !== undefined) l.forma = e.forma
  if (e.fundoId !== undefined) l.fundo_id = e.fundoId || null
  if (e.membroId !== undefined) l.membro_id = e.membroId || null
  if (e.origem !== undefined) l.origem = e.origem
  if (e.obs !== undefined) l.obs = e.obs
  return l
}

export function saidaParaLinha(s: Partial<Saida>): Linha {
  const l: Linha = {}
  if (s.categoria !== undefined) l.categoria = s.categoria
  if (s.descricao !== undefined) l.descricao = s.descricao
  if (s.fornecedor !== undefined) l.fornecedor = s.fornecedor
  if (s.valor !== undefined) l.valor = s.valor
  if (s.data !== undefined) l.data = s.data
  if (s.forma !== undefined) l.forma = s.forma
  if (s.fundoId !== undefined) l.fundo_id = s.fundoId || null
  if (s.comprovante !== undefined) l.comprovante = s.comprovante
  if (s.comprovanteUrl !== undefined) l.comprovante_url = s.comprovanteUrl
  if (s.obs !== undefined) l.obs = s.obs
  return l
}

export function contaParaLinha(c: Partial<ContaPagar>): Linha {
  const l: Linha = {}
  if (c.descricao !== undefined) l.descricao = c.descricao
  if (c.categoria !== undefined) l.categoria = c.categoria
  if (c.valor !== undefined) l.valor = c.valor
  if (c.vencimento !== undefined) l.vencimento = c.vencimento
  if (c.status !== undefined) l.status = c.status
  if (c.recorrencia !== undefined) l.recorrencia = c.recorrencia
  if (c.fundoId !== undefined) l.fundo_id = c.fundoId || null
  if (c.fornecedor !== undefined) l.fornecedor = c.fornecedor
  if (c.pagoEm !== undefined) l.pago_em = c.pagoEm || null
  if (c.saidaId !== undefined) l.saida_id = c.saidaId || null
  return l
}

export function membroParaLinha(m: Partial<Membro>): Linha {
  const l: Linha = {}
  if (m.nome !== undefined) l.nome = m.nome
  if (m.telefone !== undefined) l.telefone = m.telefone
  if (m.email !== undefined) l.email = m.email
  if (m.ministerio !== undefined) l.ministerio = m.ministerio
  if (m.batizadoEm !== undefined) l.batizado_em = m.batizadoEm || null
  if (m.nascimento !== undefined) l.nascimento = m.nascimento || null
  if (m.ativo !== undefined) l.ativo = m.ativo
  return l
}

export function configParaLinha(c: Partial<ConfigIgreja>): Linha {
  const l: Linha = {}
  if (c.nome !== undefined) l.nome = c.nome
  if (c.razaoSocial !== undefined) l.razao_social = c.razaoSocial
  if (c.cnpj !== undefined) l.cnpj = c.cnpj
  if (c.fundacao !== undefined) l.fundacao = c.fundacao
  if (c.endereco !== undefined) l.endereco = c.endereco
  if (c.cidade !== undefined) l.cidade = c.cidade
  if (c.pastor !== undefined) l.pastor = c.pastor
  if (c.pastorPresidente !== undefined) l.pastor_presidente = c.pastorPresidente
  if (c.telefone !== undefined) l.telefone = c.telefone
  if (c.pixTipo !== undefined) l.pix_tipo = c.pixTipo
  if (c.pixChave !== undefined) l.pix_chave = c.pixChave
  if (c.orcamento !== undefined) l.orcamento = c.orcamento
  return l
}

// ---------- Leitura ----------

const ORDEM_PAPEL: Record<Papel, number> = { pastor: 0, tesoureiro: 1, irmao: 2 }

/** Traduz o enum do banco (`membro`) para o do app (`irmao`). */
function papelDoBanco(p: string): Papel {
  return p === 'pastor' ? 'pastor' : p === 'tesoureiro' ? 'tesoureiro' : 'irmao'
}

/** Traduz o papel do app para o enum do banco. */
export function papelParaBanco(p: Papel): string {
  return p === 'irmao' ? 'membro' : p
}

/**
 * Carrega tudo o que o app mostra, numa tacada só.
 *
 * As consultas que a pessoa não tem direito de ver voltam vazias por causa do
 * RLS (um irmão, por exemplo, só enxerga as próprias entradas) — por isso
 * falhas de permissão não derrubam a tela, apenas trazem menos linhas.
 */
export async function carregarTudo(): Promise<Database> {
  const [perfis, papeis, membros, fundos, entradas, saidas, contas, relatorios, auditoria, config] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('membros').select('*').order('nome'),
      supabase.from('fundos').select('*').order('nome'),
      supabase.from('entradas').select('*').order('data', { ascending: false }),
      supabase.from('saidas').select('*').order('data', { ascending: false }),
      supabase.from('contas_pagar').select('*').order('vencimento'),
      supabase.from('relatorios').select('*').order('gerado_em', { ascending: false }),
      supabase.from('auditoria').select('*').order('ts', { ascending: false }).limit(400),
      supabase.from('config_igreja').select('*').maybeSingle(),
    ])

  // Junta perfil + papéis num único `Usuario`, do jeito que a interface espera.
  const porUsuario = new Map<string, Papel[]>()
  for (const l of (papeis.data ?? []) as Linha[]) {
    const id = texto(l.user_id)
    const lista = porUsuario.get(id) ?? []
    lista.push(papelDoBanco(texto(l.papel)))
    porUsuario.set(id, lista)
  }

  const usuarios: Usuario[] = ((perfis.data ?? []) as Linha[]).map((l) => {
    const id = texto(l.id)
    const meus = (porUsuario.get(id) ?? ['irmao']).sort(
      (a, b) => ORDEM_PAPEL[a] - ORDEM_PAPEL[b],
    )
    return {
      id,
      nome: texto(l.nome),
      email: texto(l.email),
      papel: meus[0] ?? 'irmao',
      papeis: meus,
      cargo: texto(l.cargo) || 'Membro',
      membroId: opcional(l.membro_id),
      criadoEm: opcional(l.criado_em),
    }
  })

  return {
    config: paraConfig((config.data as Linha) ?? null),
    usuarios: usuarios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    membros: ((membros.data ?? []) as Linha[]).map(paraMembro),
    fundos: ((fundos.data ?? []) as Linha[]).map(paraFundo),
    entradas: ((entradas.data ?? []) as Linha[]).map(paraEntrada),
    saidas: ((saidas.data ?? []) as Linha[]).map(paraSaida),
    contasPagar: ((contas.data ?? []) as Linha[]).map(paraConta),
    relatorios: ((relatorios.data ?? []) as Linha[]).map(paraRelatorio),
    auditoria: ((auditoria.data ?? []) as Linha[]).map(paraAuditoria),
  }
}

/** Banco vazio — estado inicial enquanto a primeira carga não chega. */
export function bancoVazio(): Database {
  return {
    config: paraConfig(null),
    usuarios: [],
    membros: [],
    fundos: [],
    entradas: [],
    saidas: [],
    contasPagar: [],
    relatorios: [],
    auditoria: [],
  }
}
