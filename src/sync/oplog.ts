// O log de operações e a projeção dele no "banco".
//
// Regras de convergência:
//  - cada operação é imutável e carrega um HLC (ordem total entre dispositivos);
//  - para cada (coleção, chave) vence a operação de maior HLC — last-write-wins;
//  - `del` é um tombstone: continua no log para que a exclusão se propague.
//
// Regras de autorização (o que substitui o servidor):
//  - toda operação é assinada pela chave privada do autor;
//  - o *primeiro* cadastro que o log conhece vira pastor; qualquer cadastro
//    posterior entra como membro, mesmo que o dispositivo diga o contrário;
//  - mudança de papel só vale assinada por quem é pastor naquele ponto do log;
//  - lançamentos financeiros só valem de pastor ou tesoureiro.
// Como a projeção reexecuta o log inteiro, todos os dispositivos aplicam as
// mesmas regras e chegam ao mesmo resultado.

import type { Database, Membro, Papel, Usuario } from '@/data/types'
import { jsonCanonico, temCriptografia, verificar } from './crypto'
import { ehEmailDono, normalizarPapeis, papelPrincipal, papeisDoUsuario } from './dono'
import { compararHlc } from './hlc'
import type { Colecao, Op, VersionVector } from './types'

/** Separador que não aparece em id nem em chave — evita colisão ambígua. */
const SEP = String.fromCharCode(31)

/** Mensagem exata que é assinada — precisa ser idêntica nos dois lados. */
export function mensagemDaOp(op: Op): string {
  return [op.tipo, op.col, op.key, op.hlc, op.dev, op.by, jsonCanonico(op.val ?? null)].join(SEP)
}

// Verificar ECDSA custa ~1 ms e é assíncrono, mas a projeção precisa ser
// síncrona (a interface lê o resultado logo depois de gravar). A saída é
// separar as duas coisas: `verificarOps` confere as assinaturas e guarda o
// veredito, e a projeção só consulta esse cache. Como o log é imutável, o
// veredito de uma operação nunca muda.
const cacheAssinatura = new Map<string, boolean>()

/** Confere as assinaturas ainda desconhecidas. Chame antes de projetar. */
export async function verificarOps(ops: Op[]): Promise<void> {
  // Sem WebCrypto (http sem TLS) não dá para assinar nem conferir. O app
  // continua útil como caderno local — a malha P2P fica desligada nesse modo,
  // então não há operação de terceiro para validar.
  const semCripto = !temCriptografia()
  for (const op of ops) {
    if (cacheAssinatura.has(op.id)) continue
    const ok = semCripto
      ? !!op.pub
      : !!op.sig && !!op.pub && (await verificar(op.pub, mensagemDaOp(op), op.sig))
    cacheAssinatura.set(op.id, ok)
  }
}

/**
 * Marca como válida uma operação criada por este próprio dispositivo. Não é um
 * atalho de segurança: nós somos o autor, a assinatura está sendo calculada
 * neste instante e a operação só sai daqui depois de assinada.
 */
export function confiarLocal(opId: string) {
  cacheAssinatura.set(opId, true)
}

function assinaturaValida(op: Op): boolean {
  return cacheAssinatura.get(op.id) === true
}

export function esquecerAssinaturas() {
  cacheAssinatura.clear()
}

// ---------- Estado projetado ----------

const COLECOES_FINANCEIRAS: Colecao[] = ['entradas', 'saidas', 'contasPagar', 'fundos', 'relatorios']

export interface Projecao {
  db: Database
  /** Operações descartadas por assinatura inválida ou falta de permissão. */
  rejeitadas: number
  /** Id do usuário que fundou a igreja (primeiro cadastro do log). */
  fundador: string | null
  /** Papel de cada usuário conhecido, já com as regras aplicadas. */
  papeis: Record<string, Papel>
}

export function bancoVazio(): Database {
  return {
    config: {
      nome: '',
      razaoSocial: '',
      cnpj: '',
      fundacao: '',
      endereco: '',
      cidade: '',
      pastor: '',
      pastorPresidente: '',
      telefone: '',
      pixTipo: 'CNPJ',
      pixChave: '',
      orcamento: {},
    },
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

/**
 * Reexecuta o log inteiro e devolve o estado resultante.
 * Síncrona de propósito: as assinaturas já foram conferidas por `verificarOps`.
 */
export function projetar(ops: Op[]): Projecao {
  const ordenadas = [...ops].sort((a, b) => compararHlc(a.hlc, b.hlc) || (a.id < b.id ? -1 : 1))

  // Vencedor por (coleção, chave) — preenchido conforme o log é reexecutado.
  const vencedor = new Map<string, Op>()
  let rejeitadas = 0

  // Estado de autorização, que evolui junto com a reexecução.
  const ctx: ContextoUsuarios = {
    usuarios: new Map<string, Usuario>(),
    pubDoUsuario: new Map<string, string>(),
    usuarioDaPub: new Map<string, string>(),
    fundador: null,
  }

  for (const op of ordenadas) {
    const chave = `${op.col}${SEP}${op.key}`
    const atual = vencedor.get(chave)
    // LWW: só o maior HLC importa. Empate resolve pelo id da operação.
    if (atual && (compararHlc(op.hlc, atual.hlc) < 0 || (op.hlc === atual.hlc && op.id < atual.id))) {
      continue
    }

    const assinada = assinaturaValida(op)

    if (op.col === 'usuarios') {
      const aplicada = aplicarOpUsuario(op, assinada, ctx)
      if (!aplicada) {
        rejeitadas++
        continue
      }
      vencedor.set(chave, aplicada)
      continue
    }

    // Demais coleções: precisam de um autor conhecido e assinatura conferida.
    const autorId = assinada && op.pub ? ctx.usuarioDaPub.get(op.pub) : undefined
    if (!autorId || autorId !== op.by) {
      rejeitadas++
      continue
    }
    const autorUsuario = ctx.usuarios.get(autorId)
    // O dono escreve em qualquer coleção — é a conta de manutenção do app.
    const dono = ehEmailDono(autorUsuario?.email)
    if (!autorUsuario || (!dono && !podeEscrever(op.col, autorUsuario, op.key))) {
      rejeitadas++
      continue
    }

    vencedor.set(chave, op)
  }

  return { ...montarBanco(vencedor, ctx), rejeitadas }
}

/**
 * Quem pode escrever em cada coleção. Como um usuário pode acumular papéis
 * (pastor E tesoureiro, por exemplo), a permissão é a união do que cada papel
 * dele autoriza.
 */
function podeEscrever(col: Colecao, autor: Usuario, chave: string): boolean {
  const papeis = papeisDoUsuario(autor)
  const ehPastor = papeis.includes('pastor')
  const ehTesoureiro = papeis.includes('tesoureiro')
  if (col === 'config') return ehPastor
  if (COLECOES_FINANCEIRAS.includes(col)) return ehPastor || ehTesoureiro
  if (col === 'membros') {
    // Pastor e tesoureiro cuidam do rol; cada irmão pode ajustar a própria ficha.
    return ehPastor || ehTesoureiro || autor.membroId === chave
  }
  // `auditoria` aceita de qualquer usuário conhecido: é um diário, não um saldo.
  return true
}

function montarBanco(
  vencedor: Map<string, Op>,
  ctx: ContextoUsuarios,
): Omit<Projecao, 'rejeitadas'> {
  const db = bancoVazio()
  const listas: Record<string, unknown[]> = {
    usuarios: [],
    membros: [],
    fundos: [],
    entradas: [],
    saidas: [],
    contasPagar: [],
    relatorios: [],
    auditoria: [],
  }

  for (const op of vencedor.values()) {
    if (op.tipo === 'del' || op.val == null) continue
    if (op.col === 'config') {
      db.config = { ...db.config, ...(op.val as Database['config']) }
    } else {
      listas[op.col]!.push(op.val)
    }
  }

  // Os papéis vêm sempre do estado de autorização, nunca do que a operação pediu.
  db.usuarios = (listas.usuarios as Usuario[])
    .map((u) => {
      const autorizado = ctx.usuarios.get(u.id)
      return {
        ...u,
        papel: autorizado?.papel ?? u.papel,
        papeis: autorizado ? papeisDoUsuario(autorizado) : papeisDoUsuario(u),
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  db.membros = (listas.membros as Database['membros']).sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR'),
  )
  db.fundos = listas.fundos as Database['fundos']
  db.entradas = listas.entradas as Database['entradas']
  db.saidas = listas.saidas as Database['saidas']
  db.contasPagar = listas.contasPagar as Database['contasPagar']
  db.relatorios = (listas.relatorios as Database['relatorios']).sort((a, b) =>
    b.geradoEm.localeCompare(a.geradoEm),
  )
  db.auditoria = (listas.auditoria as Database['auditoria'])
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 400)

  const papeis: Record<string, Papel> = {}
  ctx.usuarios.forEach((u, id) => {
    papeis[id] = u.papel
  })

  return { db, fundador: ctx.fundador, papeis }
}

interface ContextoUsuarios {
  usuarios: Map<string, Usuario>
  pubDoUsuario: Map<string, string>
  usuarioDaPub: Map<string, string>
  fundador: string | null
}

/**
 * Aplica uma operação sobre `usuarios` respeitando as regras de papel.
 * Devolve `null` quando a operação não é autorizada — e a operação devolvida
 * pode ter o papel corrigido em relação ao que o dispositivo pediu.
 */
function aplicarOpUsuario(op: Op, assinada: boolean, ctx: ContextoUsuarios): Op | null {
  if (!assinada || !op.pub) return null

  const existente = ctx.usuarios.get(op.key)
  const autorId = ctx.usuarioDaPub.get(op.pub)

  const autorAtual = autorId ? ctx.usuarios.get(autorId) : undefined
  const donoAutor = ehEmailDono(autorAtual?.email)
  const autorEhPastor = !!autorAtual && papeisDoUsuario(autorAtual).includes('pastor')

  // Exclusão de usuário: pastor ou dono, e nunca o fundador.
  if (op.tipo === 'del') {
    if (!autorEhPastor && !donoAutor) return null
    if (op.key === ctx.fundador) return null
    ctx.usuarios.delete(op.key)
    const pub = ctx.pubDoUsuario.get(op.key)
    if (pub) ctx.usuarioDaPub.delete(pub)
    ctx.pubDoUsuario.delete(op.key)
    return op
  }

  const proposto = op.val as Usuario | undefined
  if (!proposto || proposto.id !== op.key) return null

  /** Fixa `papeis` + `papel` principal de forma coerente. */
  const comPapeis = (base: Usuario, papeis: Papel[]): Usuario => {
    const norm = normalizarPapeis(papeis)
    return { ...base, papeis: norm, papel: papelPrincipal(norm) }
  }

  // --- Caso 1: auto-cadastro (a assinatura é a chave do próprio usuário) ---
  if (!existente) {
    if (proposto.pub !== op.pub || op.by !== proposto.id) return null
    // A conta do dono é sempre membro e nunca funda a igreja: ela deve passar
    // despercebida, então não pode assumir o posto de pastor fundador.
    if (ehEmailDono(proposto.email)) {
      const usuario = comPapeis(proposto, ['irmao'])
      ctx.usuarios.set(usuario.id, usuario)
      ctx.pubDoUsuario.set(usuario.id, op.pub)
      ctx.usuarioDaPub.set(op.pub, usuario.id)
      return { ...op, val: usuario }
    }
    // O primeiro cadastro comum funda a igreja e vira pastor. Os demais entram
    // como membro, independentemente do papel que pedirem.
    const ehFundador = ctx.fundador === null
    const usuario = comPapeis(proposto, ehFundador ? ['pastor'] : ['irmao'])
    ctx.usuarios.set(usuario.id, usuario)
    ctx.pubDoUsuario.set(usuario.id, op.pub)
    ctx.usuarioDaPub.set(op.pub, usuario.id)
    if (ehFundador) ctx.fundador = usuario.id
    return { ...op, val: usuario }
  }

  if (!autorId || !autorAtual) return null

  // --- Caso 2: pastor (ou dono) administra papéis ---
  if (autorEhPastor || donoAutor) {
    // A conta do dono continua sempre como membro, mesmo que algo tente mudá-la.
    if (ehEmailDono(existente.email)) {
      const usuario = comPapeis({ ...proposto, pub: existente.pub }, ['irmao'])
      ctx.usuarios.set(usuario.id, usuario)
      return { ...op, val: usuario }
    }
    let papeis = normalizarPapeis(proposto.papeis, proposto.papel)
    // O fundador nunca perde o posto de pastor: a igreja ficaria sem nenhum.
    if (op.key === ctx.fundador && !papeis.includes('pastor')) papeis = normalizarPapeis(['pastor', ...papeis])
    const usuario = comPapeis({ ...proposto, pub: existente.pub }, papeis)
    ctx.usuarios.set(usuario.id, usuario)
    return { ...op, val: usuario }
  }

  // --- Caso 3: edição do próprio perfil (sem tocar nos papéis) ---
  if (autorId === op.key) {
    const usuario: Usuario = {
      ...proposto,
      papel: existente.papel,
      papeis: papeisDoUsuario(existente),
      pub: existente.pub,
    }
    ctx.usuarios.set(usuario.id, usuario)
    return { ...op, val: usuario }
  }

  return null
}

// ---------- Resumo causal ----------

/** Resume o que este dispositivo possui, para negociar a troca com um par. */
export function resumo(ops: Op[]): VersionVector {
  const vv: VersionVector = {}
  for (const op of ops) {
    const atual = vv[op.dev]
    if (!atual) vv[op.dev] = { max: op.hlc, n: 1 }
    else {
      atual.n++
      if (compararHlc(op.hlc, atual.max) > 0) atual.max = op.hlc
    }
  }
  return vv
}

/**
 * Operações que este dispositivo tem e o par não.
 * Se o par tem menos operações de uma origem do que deveria, houve um buraco —
 * nesse caso mandamos o histórico inteiro daquela origem em vez do incremento.
 */
export function faltantesPara(ops: Op[], deles: VersionVector): Op[] {
  const meu = resumo(ops)
  const origensCompletas = new Set<string>()
  for (const dev of Object.keys(meu)) {
    const outro = deles[dev]
    if (!outro) {
      origensCompletas.add(dev)
      continue
    }
    // Mesmo topo de HLC mas menos operações ⇒ o par perdeu algo pelo caminho.
    if (outro.n < meu[dev]!.n && compararHlc(outro.max, meu[dev]!.max) >= 0) {
      origensCompletas.add(dev)
    }
  }
  return ops.filter((op) => {
    if (origensCompletas.has(op.dev)) return true
    const outro = deles[op.dev]
    return !outro || compararHlc(op.hlc, outro.max) > 0
  })
}

/** Cria um `Membro` a partir dos dados de um cadastro de usuário. */
export function membroDeUsuario(usuario: Usuario, membroId: string): Membro {
  return { id: membroId, nome: usuario.nome, email: usuario.email, ativo: true }
}
