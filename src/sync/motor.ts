// O motor: junta oplog, armazenamento e malha P2P num só lugar.
//
// Fluxo de uma alteração feita neste aparelho:
//   gravar() → cria a operação → projeta e avisa a interface (imediato)
//            → assina → grava no IndexedDB → transmite aos pares (em segundo plano)
//
// Fluxo de uma alteração vinda de outro aparelho:
//   malha → confere assinaturas → junta ao log → projeta → avisa a interface
//
// A interface nunca espera pela rede: o dado é local, a rede é um detalhe que
// acontece depois.

import type { Database } from '@/data/types'
import { assinar, idAleatorio, temCriptografia } from './crypto'
import { observarHlc, proximoHlc } from './hlc'
import { gravarOps, lerTodasOps, limparOps, temIdb } from './idb'
import { idDispositivo } from './identidade'
import { conectarMalha, type Malha } from './malha'
import {
  bancoVazio,
  confiarLocal,
  esquecerAssinaturas,
  faltantesPara,
  mensagemDaOp,
  projetar,
  resumo,
  verificarOps,
} from './oplog'
import type { Colecao, Op, PeerInfo, StatusRede } from './types'

export interface EstadoMotor {
  /** O log já foi lido do disco. Antes disso a interface mostra carregando. */
  pronto: boolean
  db: Database
  /** Primeiro usuário cadastrado — quem fundou a igreja. */
  fundador: string | null
  status: StatusRede
  pares: PeerInfo[]
  totalOps: number
  /** Operações recusadas por assinatura inválida ou falta de permissão. */
  rejeitadas: number
  ultimaTroca: number | null
  erro: string | null
  /** Falso em http sem TLS: sem WebCrypto não há assinatura nem malha. */
  criptografia: boolean
}

interface Autor {
  usuarioId: string
  privada: string
  publica: string
  nome: string
  papel: string
}

let ops: Op[] = []
let autor: Autor | null = null
let malha: Malha | null = null
let fila: Promise<void> = Promise.resolve()

let estado: EstadoMotor = {
  pronto: false,
  db: bancoVazio(),
  fundador: null,
  status: 'offline',
  pares: [],
  totalOps: 0,
  rejeitadas: 0,
  ultimaTroca: null,
  erro: null,
  criptografia: temCriptografia(),
}

const ouvintes = new Set<(e: EstadoMotor) => void>()

export function inscrever(fn: (e: EstadoMotor) => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function estadoAtual(): EstadoMotor {
  return estado
}

function publicar(mudanca: Partial<EstadoMotor>) {
  estado = { ...estado, ...mudanca }
  ouvintes.forEach((fn) => fn(estado))
}

/** Reprojeta o log e avisa a interface. */
function reprojetar() {
  const p = projetar(ops)
  publicar({
    db: p.db,
    fundador: p.fundador,
    rejeitadas: p.rejeitadas,
    totalOps: ops.length,
  })
}

// ---------- Ciclo de vida ----------

let iniciado = false

export async function iniciar(): Promise<void> {
  if (iniciado) return
  iniciado = true
  if (temIdb()) {
    try {
      ops = await lerTodasOps<Op>()
    } catch {
      ops = []
    }
  }
  ops.forEach((op) => observarHlc(op.hlc))
  await verificarOps(ops)
  reprojetar()
  publicar({ pronto: true })
}

/** Define quem assina as operações criadas neste aparelho. */
export function definirAutor(dados: Autor) {
  autor = dados
}

export function limparAutor() {
  autor = null
}

export function autorAtual(): Autor | null {
  return autor
}

// ---------- Escrita ----------

function novaOp(tipo: 'put' | 'del', col: Colecao, key: string, val?: unknown): Op | null {
  if (!autor) return null
  return {
    id: idAleatorio(16),
    hlc: proximoHlc(idDispositivo()),
    dev: idDispositivo(),
    by: autor.usuarioId,
    tipo,
    col,
    key,
    ...(tipo === 'put' ? { val } : {}),
    pub: autor.publica,
  }
}

/**
 * Aplica localmente agora e cuida de assinar, salvar e transmitir depois.
 * A assinatura fica pronta em poucos milissegundos, sempre antes de a operação
 * sair do aparelho — nada é transmitido sem assinatura.
 */
function registrar(novas: Op[]) {
  if (!novas.length) return
  for (const op of novas) confiarLocal(op.id)
  ops.push(...novas)
  reprojetar()

  fila = fila
    .then(async () => {
      for (const op of novas) {
        if (autor && temCriptografia()) {
          op.sig = await assinar(autor.privada, mensagemDaOp(op))
        }
      }
      if (temIdb()) await gravarOps(novas)
      malha?.transmitir(novas)
      publicar({ ultimaTroca: Date.now() })
    })
    .catch(() => {
      /* falha ao persistir não pode derrubar a interface — o dado segue em memória */
    })
}

/** Grava (ou substitui) um registro. */
export function gravar(col: Colecao, key: string, val: unknown): boolean {
  const op = novaOp('put', col, key, val)
  if (!op) return false
  registrar([op])
  return true
}

/** Grava vários registros como um único lote — usado no cadastro e na semente. */
export function gravarLote(itens: { col: Colecao; key: string; val: unknown }[]): boolean {
  const novas = itens.map((i) => novaOp('put', i.col, i.key, i.val)).filter((o): o is Op => !!o)
  if (novas.length !== itens.length) return false
  registrar(novas)
  return true
}

/** Marca um registro como excluído (a exclusão também se propaga). */
export function excluir(col: Colecao, key: string): boolean {
  const op = novaOp('del', col, key)
  if (!op) return false
  registrar([op])
  return true
}

/**
 * Cadastro do primeiro usuário: acontece antes de existir autor, então a
 * operação é assinada com o par de chaves recém-criado.
 */
export async function registrarCadastro(
  usuarioId: string,
  chaves: { privada: string; publica: string },
  itens: { col: Colecao; key: string; val: unknown }[],
): Promise<void> {
  const novas: Op[] = itens.map((i) => ({
    id: idAleatorio(16),
    hlc: proximoHlc(idDispositivo()),
    dev: idDispositivo(),
    by: usuarioId,
    tipo: 'put' as const,
    col: i.col,
    key: i.key,
    val: i.val,
    pub: chaves.publica,
  }))
  for (const op of novas) {
    if (temCriptografia()) op.sig = await assinar(chaves.privada, mensagemDaOp(op))
    confiarLocal(op.id)
  }
  ops.push(...novas)
  if (temIdb()) await gravarOps(novas)
  reprojetar()
  malha?.transmitir(novas)
}

// ---------- Entrada de operações vindas da rede ----------

async function receber(recebidas: Op[]) {
  const conhecidas = new Set(ops.map((o) => o.id))
  const novas = recebidas.filter((op) => op && op.id && !conhecidas.has(op.id))
  publicar({ ultimaTroca: Date.now() })
  if (!novas.length) return

  novas.forEach((op) => observarHlc(op.hlc))
  await verificarOps(novas)
  ops.push(...novas)
  if (temIdb()) await gravarOps(novas)
  reprojetar()
}

// ---------- Rede ----------

/** Entra na malha fixa da igreja. Sem código: todo aparelho do app é da igreja. */
export function conectar(): void {
  if (malha) desconectar()
  if (!temCriptografia()) {
    publicar({ status: 'offline', erro: 'A rede exige HTTPS (conexão segura).' })
    return
  }
  publicar({ status: 'procurando', erro: null })
  try {
    malha = conectarMalha({
      identidade: () => ({ nome: autor?.nome ?? 'Aparelho', papel: autor?.papel ?? '—' }),
      meuResumo: () => resumo(ops),
      faltantesPara: (deles) => faltantesPara(ops, deles),
      aoReceber: receber,
      aoMudarPares: (pares) =>
        publicar({ pares, status: pares.length ? 'conectado' : 'procurando' }),
      aoErro: (mensagem) => publicar({ erro: mensagem }),
    })
  } catch {
    publicar({ status: 'offline', erro: 'Não foi possível entrar na rede da igreja.' })
  }
}

export function desconectar() {
  malha?.sair()
  malha = null
  publicar({ status: 'offline', pares: [] })
}

export function ressincronizar() {
  malha?.ressincronizar()
}

export function conectado(): boolean {
  return !!malha
}

// ---------- Backup e manutenção ----------

/** O backup é o log inteiro: importar num aparelho novo reconstrói tudo. */
export function exportarLog(): Op[] {
  return ops
}

/**
 * Importa um log salvo em arquivo. Serve como plano B quando os aparelhos
 * nunca ficam abertos ao mesmo tempo: exporta num, importa no outro.
 */
export async function importarLog(recebidas: Op[]): Promise<number> {
  const antes = ops.length
  await receber(recebidas)
  return ops.length - antes
}

export async function apagarTudo(): Promise<void> {
  desconectar()
  ops = []
  esquecerAssinaturas()
  if (temIdb()) await limparOps()
  autor = null
  reprojetar()
}
