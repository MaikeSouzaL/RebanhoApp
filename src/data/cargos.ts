// Cargos eclesiásticos (títulos) da igreja.
//
// São apenas rótulos mostrados junto da pessoa — não dão nenhuma permissão no
// app. Quem manda no que a pessoa pode fazer é o acesso (Papel), definido à
// parte. Traz as formas masculina e feminina de cada cargo.

export const CARGOS: string[] = [
  'Membro',
  'Pastor',
  'Pastora',
  'Presbítero',
  'Presbítera',
  'Evangelista',
  'Missionário',
  'Missionária',
  'Diácono',
  'Diaconisa',
  'Cooperador',
  'Cooperadora',
]

/** Cargo exibível de um usuário — cai para "Membro" quando não definido. */
export function cargoDe(cargo?: string): string {
  return cargo && cargo.trim() ? cargo : 'Membro'
}
