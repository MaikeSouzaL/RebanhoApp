import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfQuarter,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  CategoriaDespesaId,
  ContaPagar,
  Entrada,
  Fundo,
  Membro,
  Saida,
  TipoEntrada,
} from '@/data/types'

export interface Period {
  inicio: string // ISO date
  fim: string // ISO date
  label: string
  tipo: 'mensal' | 'trimestral' | 'custom'
}

const isoDay = (d: Date) => format(d, 'yyyy-MM-dd')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function monthPeriod(d = new Date()): Period {
  return {
    inicio: isoDay(startOfMonth(d)),
    fim: isoDay(endOfMonth(d)),
    label: cap(format(d, "MMMM 'de' yyyy", { locale: ptBR })),
    tipo: 'mensal',
  }
}

export function quarterPeriod(d = new Date()): Period {
  const ini = startOfQuarter(d)
  const q = Math.floor(ini.getMonth() / 3) + 1
  return {
    inicio: isoDay(ini),
    fim: isoDay(endOfQuarter(d)),
    label: `${q}º trimestre · ${ini.getFullYear()}`,
    tipo: 'trimestral',
  }
}

export function customPeriod(inicio: string, fim: string): Period {
  return {
    inicio,
    fim,
    label: `${format(parseISO(inicio), 'dd/MM/yy')} — ${format(parseISO(fim), 'dd/MM/yy')}`,
    tipo: 'custom',
  }
}

/** Período anterior de mesma duração (para comparação). */
export function previousPeriod(p: Period): Period {
  const ini = parseISO(p.inicio)
  const fim = parseISO(p.fim)
  const dur = differenceInCalendarDays(fim, ini)
  const prevFim = addDays(ini, -1)
  const prevIni = addDays(prevFim, -dur)
  return { inicio: isoDay(prevIni), fim: isoDay(prevFim), label: 'período anterior', tipo: p.tipo }
}

export function inPeriod(dateIso: string, p: Period): boolean {
  return isWithinInterval(parseISO(dateIso), { start: parseISO(p.inicio), end: parseISO(p.fim) })
}

export interface EntradaFiltro {
  tipo?: TipoEntrada
  fundoId?: string
  membroId?: string
  forma?: string
  busca?: string
}

export function filterEntradas(entradas: Entrada[], p: Period | null, f: EntradaFiltro = {}): Entrada[] {
  return entradas
    .filter((e) => (p ? inPeriod(e.data, p) : true))
    .filter((e) => (f.tipo ? e.tipo === f.tipo : true))
    .filter((e) => (f.fundoId ? e.fundoId === f.fundoId : true))
    .filter((e) => (f.membroId ? e.membroId === f.membroId : true))
    .filter((e) => (f.forma ? e.forma === f.forma : true))
    .sort((a, b) => (a.data < b.data ? 1 : -1))
}

export interface SaidaFiltro {
  categoria?: CategoriaDespesaId
  fundoId?: string
  forma?: string
  busca?: string
}

export function filterSaidas(saidas: Saida[], p: Period | null, f: SaidaFiltro = {}): Saida[] {
  return saidas
    .filter((s) => (p ? inPeriod(s.data, p) : true))
    .filter((s) => (f.categoria ? s.categoria === f.categoria : true))
    .filter((s) => (f.fundoId ? s.fundoId === f.fundoId : true))
    .filter((s) => (f.forma ? s.forma === f.forma : true))
    .filter((s) =>
      f.busca
        ? (s.descricao + ' ' + (s.fornecedor ?? '')).toLowerCase().includes(f.busca.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.data < b.data ? 1 : -1))
}

export const sum = (arr: { valor: number }[]) => arr.reduce((acc, x) => acc + x.valor, 0)

export function deltaRatio(atual: number, anterior: number): number {
  if (anterior === 0) return atual === 0 ? 0 : 1
  return (atual - anterior) / anterior
}

/** Saldo acumulado (todas as movimentações até o fim do período). */
export function saldoAcumulado(entradas: Entrada[], saidas: Saida[], ateIso: string): number {
  const e = entradas.filter((x) => x.data <= ateIso)
  const s = saidas.filter((x) => x.data <= ateIso)
  return sum(e) - sum(s)
}

export interface FluxoMes {
  key: string
  label: string
  entradas: number
  saidas: number
  saldo: number // saldo acumulado ao fim do mês
}

/** Fluxo de caixa dos últimos N meses (default 6). */
export function fluxoMensal(entradas: Entrada[], saidas: Saida[], n = 6, ref = new Date()): FluxoMes[] {
  const out: FluxoMes[] = []
  for (let back = n - 1; back >= 0; back--) {
    const d = subMonths(ref, back)
    const ini = startOfMonth(d)
    const fim = endOfMonth(d)
    const key = format(ini, 'yyyy-MM')
    const inMonth = (iso: string) => iso >= isoDay(ini) && iso <= isoDay(fim)
    const ent = sum(entradas.filter((e) => inMonth(e.data)))
    const sai = sum(saidas.filter((s) => inMonth(s.data)))
    out.push({
      key,
      label: format(ini, 'MMM', { locale: ptBR }),
      entradas: ent,
      saidas: sai,
      saldo: saldoAcumulado(entradas, saidas, isoDay(fim)),
    })
  }
  return out
}

export type EntradasPorTipo = Record<TipoEntrada, number>

export function entradasPorTipo(entradas: Entrada[]): EntradasPorTipo {
  return entradas.reduce(
    (acc, e) => {
      acc[e.tipo] += e.valor
      return acc
    },
    { dizimo: 0, oferta: 0, outra: 0 } as EntradasPorTipo,
  )
}

export interface CategoriaTotal {
  categoria: CategoriaDespesaId
  total: number
}

export function saidasPorCategoria(saidas: Saida[]): CategoriaTotal[] {
  const map = new Map<CategoriaDespesaId, number>()
  for (const s of saidas) map.set(s.categoria, (map.get(s.categoria) ?? 0) + s.valor)
  return [...map.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}

export interface FundoSaldo {
  fundo: Fundo
  entradas: number
  saidas: number
  saldo: number
}

export function saldoPorFundo(fundos: Fundo[], entradas: Entrada[], saidas: Saida[], p?: Period): FundoSaldo[] {
  return fundos.map((fundo) => {
    const e = entradas.filter((x) => x.fundoId === fundo.id && (p ? inPeriod(x.data, p) : true))
    const s = saidas.filter((x) => x.fundoId === fundo.id && (p ? inPeriod(x.data, p) : true))
    const te = sum(e)
    const ts = sum(s)
    return { fundo, entradas: te, saidas: ts, saldo: te - ts }
  })
}

export interface Contribuintes {
  qtdDizimistas: number
  qtdContribuicoes: number
  totalDizimo: number
  ticketMedio: number
}

export function contribuintes(entradas: Entrada[]): Contribuintes {
  const dizimos = entradas.filter((e) => e.tipo === 'dizimo')
  const membros = new Set(dizimos.map((e) => e.membroId).filter(Boolean))
  const total = sum(dizimos)
  return {
    qtdDizimistas: membros.size,
    qtdContribuicoes: entradas.length,
    totalDizimo: total,
    ticketMedio: dizimos.length ? total / dizimos.length : 0,
  }
}

export interface RankingItem {
  membro: Membro
  total: number
  qtd: number
}

export function rankingMembros(entradas: Entrada[], membros: Membro[]): RankingItem[] {
  const map = new Map<string, { total: number; qtd: number }>()
  for (const e of entradas) {
    if (!e.membroId) continue
    const cur = map.get(e.membroId) ?? { total: 0, qtd: 0 }
    cur.total += e.valor
    cur.qtd += 1
    map.set(e.membroId, cur)
  }
  const byId = new Map(membros.map((m) => [m.id, m]))
  return [...map.entries()]
    .map(([id, v]) => ({ membro: byId.get(id)!, total: v.total, qtd: v.qtd }))
    .filter((x) => x.membro)
    .sort((a, b) => b.total - a.total)
}

export interface ContasResumo {
  emAberto: number
  vencido: number
  prox30: number
  countAberto: number
  countVencido: number
}

export function contasResumo(contas: ContaPagar[], ref = new Date()): ContasResumo {
  const hojeIso = isoDay(ref)
  const em30 = isoDay(addDays(ref, 30))
  const abertas = contas.filter((c) => c.status !== 'pago')
  const vencidas = abertas.filter((c) => c.vencimento < hojeIso)
  const prox = abertas.filter((c) => c.vencimento >= hojeIso && c.vencimento <= em30)
  return {
    emAberto: sum(abertas),
    vencido: sum(vencidas),
    prox30: sum(prox),
    countAberto: abertas.length,
    countVencido: vencidas.length,
  }
}

/** Deriva o status real (atrasado) comparando vencimento com hoje. */
export function statusConta(c: ContaPagar, ref = new Date()): 'pendente' | 'pago' | 'atrasado' {
  if (c.status === 'pago') return 'pago'
  return c.vencimento < isoDay(ref) ? 'atrasado' : 'pendente'
}

export const isoDayOf = isoDay
