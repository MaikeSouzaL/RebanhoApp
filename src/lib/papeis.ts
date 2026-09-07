import type { Papel } from '@/data/types'

/**
 * Papéis de acesso e a conta do dono.
 *
 * "Papel" é permissão (o que a pessoa pode fazer). "Cargo" é título na igreja
 * (diácono, presbítero...) e não dá poder nenhum — são coisas separadas.
 */

/** E-mail da conta de manutenção do app: acesso total, oculto das listas. */
export const EMAIL_DONO = 'maikesouzaleite@gmail.com'

export function ehEmailDono(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === EMAIL_DONO
}

/** Papéis pelos quais o dono pode navegar. */
export const PAPEIS_DEUS: Papel[] = ['pastor', 'tesoureiro', 'irmao']

const ORDEM: Record<Papel, number> = { pastor: 0, tesoureiro: 1, irmao: 2 }

/** Limpa e ordena uma lista de papéis, garantindo ao menos "irmao". */
export function normalizarPapeis(papeis: Papel[] | undefined, principal?: Papel): Papel[] {
  const base: Papel[] = papeis && papeis.length ? papeis : principal ? [principal] : ['irmao']
  const validos = base.filter(
    (p): p is Papel => p === 'pastor' || p === 'tesoureiro' || p === 'irmao',
  )
  const unicos: Papel[] = Array.from(new Set(validos.length ? validos : (['irmao'] as Papel[])))
  return unicos.sort((a, b) => ORDEM[a] - ORDEM[b])
}

/** Papel principal (o "maior") — usado no crachá e na home. */
export function papelPrincipal(papeis: Papel[]): Papel {
  return normalizarPapeis(papeis)[0] ?? 'irmao'
}

/** Todos os papéis efetivos de um usuário. */
export function papeisDoUsuario(u: { papel: Papel; papeis?: Papel[] }): Papel[] {
  return normalizarPapeis(u.papeis, u.papel)
}
