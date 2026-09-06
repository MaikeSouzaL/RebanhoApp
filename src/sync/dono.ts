// Conta do dono do aplicativo ("modo deus").
//
// Um único e-mail — o de quem construiu e mantém o app — recebe acesso total,
// de manutenção, para acompanhar como o aplicativo está funcionando em campo.
// Para as demais pessoas essa conta aparece como um membro comum; na prática
// ela é filtrada das listas, então ninguém a vê.
//
// O que isso NÃO é: um privilégio sobre dados que os outros aparelhos não
// tenham. Numa malha P2P todo aparelho já guarda o log inteiro. O modo deus é
// conveniência de manutenção do dono — ver todas as telas e escrever em
// qualquer papel a partir da própria conta —, não um vazamento de dados novo.

import type { Database, Papel } from '@/data/types'

/** E-mail do dono. Comparado sempre em minúsculas. */
export const EMAIL_DONO = 'maikesouzaleite@gmail.com'

export function ehEmailDono(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === EMAIL_DONO
}

export interface IdentidadeDono {
  usuarioId?: string
  membroId?: string
  nome?: string
}

/** Localiza a conta do dono no banco projetado, se ela já existir por aqui. */
export function identidadeDono(db: Database): IdentidadeDono {
  const u = db.usuarios.find((x) => ehEmailDono(x.email))
  if (!u) return {}
  return { usuarioId: u.id, membroId: u.membroId, nome: u.nome }
}

/** Papéis pelos quais o dono pode navegar no modo deus. */
export const PAPEIS_DEUS: Papel[] = ['pastor', 'tesoureiro', 'irmao']

const ORDEM_PAPEL: Record<Papel, number> = { pastor: 0, tesoureiro: 1, irmao: 2 }

/** Limpa e ordena uma lista de papéis, garantindo ao menos "irmao". */
export function normalizarPapeis(papeis: Papel[] | undefined, principal?: Papel): Papel[] {
  const base: Papel[] = papeis && papeis.length ? papeis : principal ? [principal] : ['irmao']
  const validos = base.filter((p): p is Papel => p === 'pastor' || p === 'tesoureiro' || p === 'irmao')
  const unicos: Papel[] = Array.from(new Set(validos.length ? validos : (['irmao'] as Papel[])))
  return unicos.sort((a, b) => ORDEM_PAPEL[a] - ORDEM_PAPEL[b])
}

/** Papel principal (o "maior") de uma lista — usado no crachá e na home. */
export function papelPrincipal(papeis: Papel[]): Papel {
  return normalizarPapeis(papeis)[0] ?? 'irmao'
}

/** Todos os papéis efetivos de um usuário (usa `papeis`, cai para `papel`). */
export function papeisDoUsuario(u: { papel: Papel; papeis?: Papel[] }): Papel[] {
  return normalizarPapeis(u.papeis, u.papel)
}
