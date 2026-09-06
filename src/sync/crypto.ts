// Criptografia do app (WebCrypto).
//
// Sem backend, ninguém valida nada do lado do servidor. O que substitui isso é
// assinatura digital: cada usuário tem um par de chaves ECDSA e toda operação
// vai assinada. Assim um dispositivo qualquer da malha não consegue forjar
// "me promova a pastor" — a assinatura não bate.
//
// Senhas nunca são guardadas em texto: só o PBKDF2 (SHA-256, 150 mil rodadas)
// com sal aleatório por usuário.

const ALGO_CHAVE: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' }
const ALGO_ASSINATURA: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' }
const PBKDF2_ROUNDS = 150_000

/**
 * WebCrypto só existe em contexto seguro (https ou localhost). Em http puro
 * (testar por IP na rede local, por exemplo) o app continua funcionando como
 * caderno local, mas sem assinatura e sem malha P2P.
 */
export function temCriptografia(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle
}

// ---------- Utilidades ----------

const enc = new TextEncoder()

export function paraBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function deBase64(txt: string): Uint8Array<ArrayBuffer> {
  const b64 = txt.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='))
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * JSON com chaves ordenadas. Dois dispositivos precisam gerar exatamente os
 * mesmos bytes para o mesmo objeto, senão a assinatura nunca confere.
 */
export function jsonCanonico(valor: unknown): string {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor) ?? 'null'
  if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(',')}]`
  const obj = valor as Record<string, unknown>
  const chaves = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${chaves.map((k) => `${JSON.stringify(k)}:${jsonCanonico(obj[k])}`).join(',')}}`
}

/** Identificador aleatório curto e sem ambiguidade visual. */
export function idAleatorio(tamanho = 12): string {
  const alfabeto = '23456789abcdefghijkmnpqrstuvwxyz'
  const bytes = new Uint8Array(new ArrayBuffer(tamanho))
  crypto.getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < tamanho; i++) s += alfabeto[bytes[i]! % alfabeto.length]
  return s
}

// ---------- Senhas ----------

export function novoSal(): string {
  const b = new Uint8Array(new ArrayBuffer(16))
  crypto.getRandomValues(b)
  return paraBase64(b)
}

/** Deriva o hash da senha. Retorna string vazia se não houver WebCrypto. */
export async function hashSenha(senha: string, sal: string): Promise<string> {
  if (!temCriptografia()) return ''
  const base = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: deBase64(sal), iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    base,
    256,
  )
  return paraBase64(bits)
}

/** Comparação em tempo constante, para não vazar o hash pelo tempo de resposta. */
export function comparaSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

// ---------- Assinaturas ----------

export interface ParDeChaves {
  /** JWK serializado em base64url. Vai no cadastro e todos podem ver. */
  publica: string
  /** JWK serializado em base64url. Nunca sai deste aparelho. */
  privada: string
}

export async function gerarParDeChaves(): Promise<ParDeChaves | null> {
  if (!temCriptografia()) return null
  const par = await crypto.subtle.generateKey(ALGO_CHAVE, true, ['sign', 'verify'])
  const pub = await crypto.subtle.exportKey('jwk', par.publicKey)
  const priv = await crypto.subtle.exportKey('jwk', par.privateKey)
  return {
    publica: paraBase64(enc.encode(JSON.stringify(pub))),
    privada: paraBase64(enc.encode(JSON.stringify(priv))),
  }
}

function jwkDe(texto: string): JsonWebKey {
  return JSON.parse(new TextDecoder().decode(deBase64(texto))) as JsonWebKey
}

export async function assinar(privadaB64: string, mensagem: string): Promise<string> {
  if (!temCriptografia()) return ''
  const chave = await crypto.subtle.importKey('jwk', jwkDe(privadaB64), ALGO_CHAVE, false, ['sign'])
  const sig = await crypto.subtle.sign(ALGO_ASSINATURA, chave, enc.encode(mensagem))
  return paraBase64(sig)
}

export async function verificar(
  publicaB64: string,
  mensagem: string,
  assinatura: string,
): Promise<boolean> {
  if (!temCriptografia()) return false
  try {
    const chave = await crypto.subtle.importKey('jwk', jwkDe(publicaB64), ALGO_CHAVE, false, [
      'verify',
    ])
    return await crypto.subtle.verify(
      ALGO_ASSINATURA,
      chave,
      deBase64(assinatura),
      enc.encode(mensagem),
    )
  } catch {
    return false
  }
}

// ---------- Guarda da chave privada ----------
//
// A chave privada precisa acompanhar a pessoa, não o aparelho: quem trocar de
// celular tem que continuar entrando na mesma conta. Por isso ela viaja no
// cadastro cifrada com a própria senha (AES-GCM, chave derivada por PBKDF2).
// Quem está na malha vê o pacote cifrado; sem a senha ele não serve para nada.

export interface ChaveCifrada {
  ct: string
  iv: string
  sal: string
}

async function chaveAes(senha: string, sal: string, uso: 'encrypt' | 'decrypt') {
  const base = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: deBase64(sal), iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    [uso],
  )
}

export async function cifrarComSenha(texto: string, senha: string): Promise<ChaveCifrada | null> {
  if (!temCriptografia()) return null
  const sal = novoSal()
  const iv = new Uint8Array(new ArrayBuffer(12))
  crypto.getRandomValues(iv)
  const chave = await chaveAes(senha, sal, 'encrypt')
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, enc.encode(texto))
  return { ct: paraBase64(ct), iv: paraBase64(iv), sal }
}

export async function decifrarComSenha(
  pacote: ChaveCifrada,
  senha: string,
): Promise<string | null> {
  if (!temCriptografia()) return null
  try {
    const chave = await chaveAes(senha, pacote.sal, 'decrypt')
    const texto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: deBase64(pacote.iv) },
      chave,
      deBase64(pacote.ct),
    )
    return new TextDecoder().decode(texto)
  } catch {
    return null
  }
}

/** Impressão digital curta de uma chave pública — para conferir "olho no olho". */
export async function impressaoDigital(publicaB64: string): Promise<string> {
  if (!temCriptografia()) return '—'
  const buf = await crypto.subtle.digest('SHA-256', deBase64(publicaB64))
  return paraBase64(buf).slice(0, 12).toUpperCase()
}
