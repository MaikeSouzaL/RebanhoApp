import { create } from 'zustand'
import * as motor from '@/sync/motor'
import type { PeerInfo, StatusRede } from '@/sync/types'

/** Espelho do estado do motor de sincronização, para a interface consumir. */
interface RedeState {
  status: StatusRede
  pares: PeerInfo[]
  totalOps: number
  rejeitadas: number
  ultimaTroca: number | null
  erro: string | null
  criptografia: boolean

  conectar: () => void
  desconectar: () => void
  ressincronizar: () => void
}

const inicial = motor.estadoAtual()

export const useRede = create<RedeState>(() => ({
  status: inicial.status,
  pares: inicial.pares,
  totalOps: inicial.totalOps,
  rejeitadas: inicial.rejeitadas,
  ultimaTroca: inicial.ultimaTroca,
  erro: inicial.erro,
  criptografia: inicial.criptografia,

  conectar: () => motor.conectar(),
  desconectar: () => motor.desconectar(),
  ressincronizar: () => motor.ressincronizar(),
}))

motor.inscrever((e) =>
  useRede.setState({
    status: e.status,
    pares: e.pares,
    totalOps: e.totalOps,
    rejeitadas: e.rejeitadas,
    ultimaTroca: e.ultimaTroca,
    erro: e.erro,
    criptografia: e.criptografia,
  }),
)
