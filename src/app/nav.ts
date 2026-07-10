import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Sprout,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Papel } from '@/data/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
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
