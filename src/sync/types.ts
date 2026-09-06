// Tipos do motor de sincronização P2P.
//
// O app não tem backend: cada dispositivo guarda um *log de operações* (oplog)
// e os dispositivos trocam operações entre si via WebRTC. O estado final
// (o "banco") é sempre uma projeção determinística desse log — por isso dois
// dispositivos que viram as mesmas operações chegam exatamente ao mesmo dado,
// independentemente da ordem em que as receberam.

/** Coleções replicadas. `config` é um registro único (chave fixa). */
export type Colecao =
  | 'config'
  | 'usuarios'
  | 'membros'
  | 'fundos'
  | 'entradas'
  | 'saidas'
  | 'contasPagar'
  | 'relatorios'
  | 'auditoria'

export const COLECOES: Colecao[] = [
  'config',
  'usuarios',
  'membros',
  'fundos',
  'entradas',
  'saidas',
  'contasPagar',
  'relatorios',
  'auditoria',
]

/**
 * Uma operação imutável no log. `put` grava o registro inteiro, `del` marca
 * como excluído (tombstone). O vencedor de um conflito é o maior `hlc` —
 * last-write-wins por registro.
 */
export interface Op {
  /** Identificador único da operação (nunca reutilizado). */
  id: string
  /** Relógio lógico híbrido — ordenável lexicograficamente. */
  hlc: string
  /** Dispositivo que originou a operação. */
  dev: string
  /** Usuário autor (vazio no cadastro inicial, quando ainda não há usuário). */
  by: string
  tipo: 'put' | 'del'
  col: Colecao
  /** Chave do registro dentro da coleção. */
  key: string
  /** Conteúdo do registro (ausente em `del`). */
  val?: unknown
  /** Assinatura ECDSA P-256 do autor, em base64url. */
  sig?: string
  /** Chave pública do autor (base64url do JWK) — presente no auto-cadastro. */
  pub?: string
}

/**
 * Resumo causal do que um dispositivo já possui: para cada dispositivo de
 * origem, o maior `hlc` visto e quantas operações dele estão guardadas.
 * O contador detecta buracos (recebi a op 7 mas nunca a 5).
 */
export type VersionVector = Record<string, { max: string; n: number }>

export interface PeerInfo {
  id: string
  nome?: string
  papel?: string
  dispositivo?: string
  desde: number
  ops?: number
}

export type StatusRede = 'offline' | 'procurando' | 'conectado'
