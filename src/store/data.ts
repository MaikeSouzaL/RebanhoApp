import { create } from 'zustand'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { bancoVazio, carregarTudo } from '@/data/api'
import { services } from '@/data/services'
import type {
  AuditEntry,
  ConfigIgreja,
  ContaPagar,
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
  /** Verdadeiro durante a primeira carga vinda do banco. */
  carregando: boolean

  recarregar: () => Promise<void>
  addEntrada: (input: Omit<Entrada, 'id' | 'competencia'>) => Promise<void>
  updateEntrada: (id: string, patch: Partial<Entrada>) => Promise<void>
  removeEntrada: (id: string) => Promise<void>
  addSaida: (input: Omit<Saida, 'id' | 'competencia'>) => Promise<void>
  updateSaida: (id: string, patch: Partial<Saida>) => Promise<void>
  removeSaida: (id: string) => Promise<void>
  addConta: (input: Omit<ContaPagar, 'id'>) => Promise<void>
  updateConta: (id: string, patch: Partial<ContaPagar>) => Promise<void>
  pagarConta: (id: string, dataPagamento: string) => Promise<void>
  addMembro: (input: Omit<Membro, 'id'>) => Promise<void>
  updateMembro: (id: string, patch: Partial<Membro>) => Promise<void>
  addFundo: (input: Omit<Fundo, 'id'>) => Promise<void>
  definirPapeis: (usuarioId: string, papeis: Papel[], cargo?: string) => Promise<void>
  saveConfig: (patch: Partial<ConfigIgreja>) => Promise<void>
  addRelatorio: (input: Omit<Relatorio, 'id' | 'geradoEm'>) => Promise<void>
}

export const useData = create<DataState>((set, get) => {
  /**
   * Executa uma escrita e recarrega o que está na tela.
   * O erro vira aviso visível: sem servidor não havia como uma gravação ser
   * recusada, agora há — e o silêncio seria pior que a falha.
   */
  async function mutar(acao: () => Promise<void>) {
    try {
      await acao()
      await get().recarregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return {
    ...bancoVazio(),
    carregando: true,

    recarregar: async () => {
      try {
        const dados = await carregarTudo()
        set({ ...dados, carregando: false })
      } catch {
        set({ carregando: false })
      }
    },

    addEntrada: (input) => mutar(async () => void (await services.addEntrada(input))),
    updateEntrada: (id, patch) => mutar(() => services.updateEntrada(id, patch)),
    removeEntrada: (id) => mutar(() => services.removeEntrada(id)),

    addSaida: (input) => mutar(async () => void (await services.addSaida(input))),
    updateSaida: (id, patch) => mutar(() => services.updateSaida(id, patch)),
    removeSaida: (id) => mutar(() => services.removeSaida(id)),

    addConta: (input) => mutar(() => services.addConta(input)),
    updateConta: (id, patch) => mutar(() => services.updateConta(id, patch)),
    pagarConta: (id, dataPagamento) => mutar(() => services.pagarConta(id, dataPagamento)),

    addMembro: (input) => mutar(() => services.addMembro(input)),
    updateMembro: (id, patch) => mutar(() => services.updateMembro(id, patch)),

    addFundo: (input) => mutar(() => services.addFundo(input)),

    definirPapeis: (usuarioId, papeis, cargo) =>
      mutar(() => services.definirPapeis(usuarioId, papeis, cargo)),

    saveConfig: (patch) => mutar(() => services.saveConfig(patch)),
    addRelatorio: (input) => mutar(() => services.addRelatorio(input)),
  }
})

// ---------- Tempo real ----------
//
// O tesoureiro lança um dízimo e o celular do pastor atualiza sozinho, sem
// ninguém puxar para recarregar. É o que a malha P2P tentava fazer — só que
// aqui funciona mesmo com os aparelhos em horários diferentes.

let canal: ReturnType<typeof supabase.channel> | null = null

export function ligarTempoReal() {
  if (canal) return
  canal = supabase
    .channel('rebanho-mudancas')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      void useData.getState().recarregar()
    })
    .subscribe()
}

export function desligarTempoReal() {
  if (!canal) return
  void supabase.removeChannel(canal)
  canal = null
}
