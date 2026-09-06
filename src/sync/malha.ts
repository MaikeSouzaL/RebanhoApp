// A malha P2P.
//
// Sobre WebRTC, dois navegadores não se acham sozinhos: alguém precisa
// apresentá-los. O Trystero faz essa apresentação por relays Nostr públicos —
// não há servidor nosso no caminho, e nenhum dado da igreja passa por eles:
// o relay só carrega o aperto de mão, cifrado com o código da igreja.
// Depois disso a conversa é direta entre os aparelhos.
//
// Consequência que vale ter em mente: o aparelho só troca dados enquanto o app
// está aberto. Aparelho fechado é aparelho offline.

import { joinRoom, selfId, type DataPayload, type Room } from 'trystero'
import type { Op, PeerInfo, VersionVector } from './types'
import { idDispositivo, nomeAparelho } from './identidade'
import { APP_ID, SALA_IGREJA, SENHA_MALHA } from './rede-config'

const OPS_POR_LOTE = 40

interface Apresentacao {
  nome: string
  papel: string
  dispositivo: string
  aparelho: string
}

export interface OpcoesMalha {
  /** Quem sou eu, para aparecer na lista de aparelhos do outro lado. */
  identidade: () => { nome: string; papel: string }
  /** Resumo do que já tenho — o par usa para calcular o que me falta. */
  meuResumo: () => VersionVector
  /** O que eu tenho e o par (com este resumo) não tem. */
  faltantesPara: (deles: VersionVector) => Op[]
  /** Operações recebidas de um par. */
  aoReceber: (ops: Op[]) => Promise<void>
  aoMudarPares: (pares: PeerInfo[]) => void
  aoErro: (mensagem: string) => void
}

export interface Malha {
  /** Envia operações novas para todos os aparelhos conectados. */
  transmitir: (ops: Op[]) => void
  /** Pede a todos que reenviem o que estiver faltando. */
  ressincronizar: () => void
  pares: () => PeerInfo[]
  sair: () => void
  meuId: string
}

export function conectarMalha(op: OpcoesMalha): Malha {
  const conhecidos = new Map<string, PeerInfo>()

  let room: Room
  try {
    room = joinRoom(
      // A senha cifra o aperto de mão: só aparelhos com o app conversam.
      { appId: APP_ID, password: SENHA_MALHA },
      SALA_IGREJA,
      { onJoinError: (e) => op.aoErro(e.error) },
    )
  } catch (e) {
    op.aoErro(e instanceof Error ? e.message : 'Falha ao entrar na rede.')
    throw e
  }

  function publicarPares() {
    op.aoMudarPares([...conhecidos.values()])
  }

  // O Trystero tipa a carga como JSON genérico; os `as` abaixo apenas
  // reconciliam isso com os tipos do domínio nas duas pontas.
  const apresentacao = room.makeAction('oi', {
    onMessage: (bruto: DataPayload, ctx) => {
      const dados = bruto as unknown as Apresentacao
      const anterior = conhecidos.get(ctx.peerId)
      conhecidos.set(ctx.peerId, {
        id: ctx.peerId,
        nome: dados.nome,
        papel: dados.papel,
        dispositivo: dados.dispositivo,
        desde: anterior?.desde ?? Date.now(),
      })
      publicarPares()
    },
  })

  // Um par manda o resumo do que tem; respondemos só com o que falta a ele.
  const resumo = room.makeAction('resumo', {
    onMessage: (bruto: DataPayload, ctx) => {
      const faltantes = op.faltantesPara(bruto as unknown as VersionVector)
      for (let i = 0; i < faltantes.length; i += OPS_POR_LOTE) {
        void lote.send(faltantes.slice(i, i + OPS_POR_LOTE) as unknown as DataPayload, {
          target: ctx.peerId,
        })
      }
    },
  })

  const lote = room.makeAction('ops', {
    onMessage: async (bruto: DataPayload) => {
      const ops = bruto as unknown as Op[]
      if (Array.isArray(ops) && ops.length) await op.aoReceber(ops)
    },
  })

  function cumprimentar(peerId?: string) {
    const eu = op.identidade()
    const alvo = peerId ? { target: peerId } : undefined
    const quemSou: Apresentacao = {
      nome: eu.nome,
      papel: eu.papel,
      dispositivo: idDispositivo(),
      aparelho: nomeAparelho(),
    }
    void apresentacao.send(quemSou as unknown as DataPayload, alvo)
    void resumo.send(op.meuResumo() as unknown as DataPayload, alvo)
  }

  room.onPeerJoin = (peerId) => {
    conhecidos.set(peerId, { id: peerId, desde: Date.now() })
    publicarPares()
    cumprimentar(peerId)
  }

  room.onPeerLeave = (peerId) => {
    conhecidos.delete(peerId)
    publicarPares()
  }

  return {
    transmitir: (ops) => {
      if (!ops.length) return
      for (let i = 0; i < ops.length; i += OPS_POR_LOTE) {
        void lote.send(ops.slice(i, i + OPS_POR_LOTE) as unknown as DataPayload)
      }
    },
    ressincronizar: () => cumprimentar(),
    pares: () => [...conhecidos.values()],
    sair: () => {
      room.onPeerJoin = null
      room.onPeerLeave = null
      void room.leave()
    },
    meuId: selfId,
  }
}
