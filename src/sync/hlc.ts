// Relógio lógico híbrido (Hybrid Logical Clock).
//
// Um timestamp comum não serve para ordenar eventos entre dispositivos: os
// relógios das pessoas estão errados. O HLC combina o relógio de parede com um
// contador que só cresce, e "aprende" com os timestamps recebidos dos outros.
// Resultado: uma ordem total, estável e consistente com a causalidade.
//
// Formato: `<ms base36, 9 dígitos>-<contador base36, 4 dígitos>-<dispositivo>`
// — desenhado para que comparar duas strings dê a ordem correta.

const MS_LEN = 9
const CT_LEN = 4
const MAX_CT = 36 ** CT_LEN - 1

let ultimoMs = 0
let contador = 0

function enc(n: number, len: number): string {
  return n.toString(36).padStart(len, '0')
}

/** Gera o próximo timestamp local para este dispositivo. */
export function proximoHlc(dispositivo: string): string {
  const agora = Date.now()
  if (agora > ultimoMs) {
    ultimoMs = agora
    contador = 0
  } else if (contador >= MAX_CT) {
    // Estouro do contador no mesmo milissegundo: empurra o relógio adiante.
    ultimoMs += 1
    contador = 0
  } else {
    contador += 1
  }
  return `${enc(ultimoMs, MS_LEN)}-${enc(contador, CT_LEN)}-${dispositivo}`
}

/**
 * Avança o relógio local ao ver um timestamp remoto, para que qualquer
 * operação criada daqui em diante ordene depois da que acabamos de receber.
 */
export function observarHlc(hlc: string): void {
  const partes = hlc.split('-')
  if (partes.length < 3) return
  const ms = parseInt(partes[0]!, 36)
  const ct = parseInt(partes[1]!, 36)
  if (!Number.isFinite(ms) || !Number.isFinite(ct)) return
  if (ms > ultimoMs) {
    ultimoMs = ms
    contador = ct
  } else if (ms === ultimoMs && ct > contador) {
    contador = ct
  }
}

/** Ordem total entre dois timestamps (negativo = `a` veio antes). */
export function compararHlc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Momento aproximado (relógio de parede) codificado no timestamp. */
export function msDoHlc(hlc: string): number {
  const ms = parseInt(hlc.split('-')[0] ?? '', 36)
  return Number.isFinite(ms) ? ms : 0
}
