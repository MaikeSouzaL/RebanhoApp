import { create } from 'zustand'
import { services } from '@/data/services'
import type {
  ConfigIgreja,
  ContaPagar,
  Entrada,
  Fundo,
  Membro,
  Relatorio,
  Saida,
} from '@/data/types'

interface DataState {
  membros: Membro[]
  fundos: Fundo[]
  entradas: Entrada[]
  saidas: Saida[]
  contasPagar: ContaPagar[]
  relatorios: Relatorio[]
  config: ConfigIgreja

  addEntrada: (input: Omit<Entrada, 'id' | 'competencia'>) => void
  removeEntrada: (id: string) => void
  addSaida: (input: Omit<Saida, 'id' | 'competencia'>) => void
  removeSaida: (id: string) => void
  addConta: (input: Omit<ContaPagar, 'id'>) => void
  updateConta: (id: string, patch: Partial<ContaPagar>) => void
  pagarConta: (id: string, dataPagamento: string) => void
  saveConfig: (patch: Partial<ConfigIgreja>) => void
  addRelatorio: (input: Omit<Relatorio, 'id' | 'geradoEm'>) => void
  resetDados: () => void
}

function refresh() {
  const s = services.snapshot()
  return {
    membros: s.membros,
    fundos: s.fundos,
    entradas: s.entradas,
    saidas: s.saidas,
    contasPagar: s.contasPagar,
    relatorios: s.relatorios,
    config: s.config,
  }
}

export const useData = create<DataState>((set) => ({
  ...refresh(),

  addEntrada: (input) => {
    services.addEntrada(input)
    set(refresh())
  },
  removeEntrada: (id) => {
    services.removeEntrada(id)
    set(refresh())
  },
  addSaida: (input) => {
    services.addSaida(input)
    set(refresh())
  },
  removeSaida: (id) => {
    services.removeSaida(id)
    set(refresh())
  },
  addConta: (input) => {
    services.addConta(input)
    set(refresh())
  },
  updateConta: (id, patch) => {
    services.updateConta(id, patch)
    set(refresh())
  },
  pagarConta: (id, dataPagamento) => {
    services.pagarConta(id, dataPagamento)
    set(refresh())
  },
  saveConfig: (patch) => {
    services.saveConfig(patch)
    set(refresh())
  },
  addRelatorio: (input) => {
    services.addRelatorio(input)
    set(refresh())
  },
  resetDados: () => {
    services.reset()
    set(refresh())
  },
}))
