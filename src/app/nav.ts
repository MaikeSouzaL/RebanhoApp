import {
  ArrowDownCircle,
  ArrowUpCircle,
  Cake,
  FileText,
  HandCoins,
  History,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Receipt,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Papel } from '@/data/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  desc?: string
}

/** Abas principais (bottom nav) do Pastor. */
export const PASTOR_TABS: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/entradas', label: 'Entradas', icon: ArrowUpCircle },
  { to: '/saidas', label: 'Saídas', icon: ArrowDownCircle },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/relatorios', label: 'Relatório', icon: FileText },
]

/** Abas principais (bottom nav) do Tesoureiro. */
export const TESOUREIRO_TABS: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/entradas', label: 'Entradas', icon: ArrowUpCircle },
  { to: '/saidas', label: 'Saídas', icon: ArrowDownCircle },
  { to: '/lancamentos', label: 'Lançamentos', icon: ListChecks },
  { to: '/contas', label: 'Contas', icon: Receipt },
]

/** Abas principais (bottom nav) dos Irmãos. */
export const IRMAO_TABS: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/fundos', label: 'Campanhas', icon: Sprout },
  { to: '/contribuir', label: 'Contribuir', icon: HandCoins },
  { to: '/minha', label: 'Minha conta', icon: UserRound },
]

export function tabsForRole(papel: Papel | undefined): NavItem[] {
  if (papel === 'tesoureiro') return TESOUREIRO_TABS
  if (papel === 'irmao') return IRMAO_TABS
  return PASTOR_TABS
}

// ---- Itens secundários (menu / barra lateral) ----
const USUARIOS: NavItem = { to: '/usuarios', label: 'Usuários', icon: ShieldCheck, desc: 'Definir pastores e tesoureiros' }
const MEMBROS: NavItem = { to: '/membros', label: 'Membros', icon: Users, desc: 'Contribuintes e histórico' }
const ANIVERSARIOS: NavItem = { to: '/aniversariantes', label: 'Aniversariantes', icon: Cake, desc: 'Do mês' }
const FUNDOS: NavItem = { to: '/fundos', label: 'Fundos', icon: PiggyBank, desc: 'Missões, construção, assistência' }
const ATIVIDADE: NavItem = { to: '/atividade', label: 'Atividade', icon: History, desc: 'Histórico de ações' }
const CONTRIBUIR: NavItem = { to: '/contribuir', label: 'Contribuir', icon: HandCoins, desc: 'Chave Pix e QR Code' }
const CONFIG: NavItem = { to: '/config', label: 'Configurações', icon: Settings, desc: 'Seus dados e a igreja' }

/** Destinos além das abas principais — mostrados no menu e na barra lateral. */
export function menuLinksForRole(papel: Papel | undefined): NavItem[] {
  if (papel === 'irmao') return [CONTRIBUIR, FUNDOS, CONFIG]
  if (papel === 'pastor') return [USUARIOS, MEMBROS, ANIVERSARIOS, FUNDOS, ATIVIDADE, CONFIG]
  return [MEMBROS, ANIVERSARIOS, FUNDOS, ATIVIDADE, CONFIG]
}
