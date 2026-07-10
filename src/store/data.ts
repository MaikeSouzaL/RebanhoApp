import { create } from 'zustand'
import { services } from '@/data/services'
import type {
  AuditEntry,
  ConfigIgreja,
  ContaPagar,
  Database,
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
  auditoria: AuditEntry[]
  config: ConfigIgreja

  addEntrada: (input: Omit<Entrada, 'id' | 'competencia'>) => void
  updateEntrada: (id: string, patch: Partial<Entrada>) => void
  removeEntrada: (id: string) => void
  addSaida: (input: Omit<Saida, 'id' | 'competencia'>) => void
  updateSaida: (id: string, patch: Partial<Saida>) => void
  removeSaida: (id: string) => void
  addConta: (input: Omit<ContaPagar, 'id'>) => void
  updateConta: (id: string, patch: Partial<ContaPagar>) => void
  pagarConta: (id: string, dataPagamento: string) => void
  saveConfig: (patch: Partial<ConfigIgreja>) => void
  addRelatorio: (input: Omit<Relatorio, 'id' | 'geradoEm'>) => void
  importBackup: (data: Database) => void
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
    auditoria: s.auditoria,
    config: s.config,
  }
}

export const useData = create<DataState>((set) => ({
  ...refresh(),

  addEntrada: (input) => {
    services.addEntrada(input)
    set(refresh())
  },
  updateEntrada: (id, patch) => {
    services.updateEntrada(id, patch)
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
  updateSaida: (id, patch) => {
    services.updateSaida(id, patch)
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
  importBackup: (data) => {
    services.importBackup(data)
    set(refresh())
  },
  resetDados: () => {
    services.reset()
    set(refresh())
  },
}))
