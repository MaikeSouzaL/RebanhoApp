// Identidade local: o que pertence a *este* aparelho e nunca é replicado.
//
// Duas coisas moram só aqui:
//  - o id do dispositivo (origem das operações que ele cria);
//  - a chave privada do usuário logado neste aparelho.
//
// A chave privada em particular jamais entra no oplog: se vazasse, qualquer
// dispositivo poderia assinar no lugar da pessoa.

import { idAleatorio } from './crypto'
import { gravarMeta, lerMeta } from './idb'

const CHAVE_DISPOSITIVO = 'rebanho-dispositivo'
const CHAVE_NOME_APARELHO = 'rebanho-nome-aparelho'
const META_PRIVADA = 'chave-privada'

let dispositivoCache: string | null = null

/** Id estável deste aparelho. Criado na primeira abertura e nunca muda. */
export function idDispositivo(): string {
  if (dispositivoCache) return dispositivoCache
  let id = localStorage.getItem(CHAVE_DISPOSITIVO)
  if (!id) {
    id = idAleatorio(10)
    localStorage.setItem(CHAVE_DISPOSITIVO, id)
  }
  dispositivoCache = id
  return id
}

/** Nome amigável do aparelho, mostrado na lista de dispositivos conectados. */
export function nomeAparelho(): string {
  const salvo = localStorage.getItem(CHAVE_NOME_APARELHO)
  if (salvo) return salvo
  const ua = navigator.userAgent
  const palpite = /iPhone|iPad/i.test(ua)
    ? 'iPhone'
    : /Android/i.test(ua)
      ? 'Android'
      : /Macintosh/i.test(ua)
        ? 'Mac'
        : /Windows/i.test(ua)
          ? 'Windows'
          : 'Navegador'
  return palpite
}

export function definirNomeAparelho(nome: string) {
  localStorage.setItem(CHAVE_NOME_APARELHO, nome.trim() || nomeAparelho())
}

// ---------- Chave privada do usuário logado ----------

interface ChaveGuardada {
  usuarioId: string
  privada: string
  publica: string
}

export async function guardarChave(usuarioId: string, privada: string, publica: string) {
  await gravarMeta(META_PRIVADA, { usuarioId, privada, publica } satisfies ChaveGuardada)
}

export async function lerChave(): Promise<ChaveGuardada | null> {
  return (await lerMeta<ChaveGuardada>(META_PRIVADA)) ?? null
}

export async function limparChave() {
  await gravarMeta(META_PRIVADA, undefined)
}
