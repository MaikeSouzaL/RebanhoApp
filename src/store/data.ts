import { create } from 'zustand'
import { services } from '@/data/services'
import { inscrever } from '@/sync/motor'
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
} from '@/data/types'

interface DataState {
  usuarios: Usuario[]
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
  addMembro: (input: Omit<Membro, 'id'>) => void
  updateMembro: (id: string, patch: Partial<Membro>) => void
  definirPapeis: (usuarioId: string, papeis: Papel[], cargo?: string) => void
  removeUsuario: (id: string) => void
  importBackup: (data: Database) => void
  resetDados: () => void
}

function refresh() {
  const s = services.snapshot()
  return {
    usuarios: s.usuarios,
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
  addMembro: (input) => {
    services.addMembro(input)
    set(refresh())
  },
  updateMembro: (id, patch) => {
    services.updateMembro(id, patch)
    set(refresh())
  },
  definirPapeis: (usuarioId, papeis, cargo) => {
    services.definirPapeis(usuarioId, papeis, cargo)
    set(refresh())
  },
  removeUsuario: (id) => {
    services.removeUsuario(id)
    set(refresh())
  },
  importBackup: (data) => {
    services.importBackup(data)
    set(refresh())
  },
  resetDados: () => {
    void services.reset()
    set(refresh())
  },
}))

// Alterações que chegam de outro aparelho (ou do carregamento inicial do log)
// entram por aqui — a tela reage igual a uma edição feita neste celular.
inscrever(() => useData.setState(refresh()))
