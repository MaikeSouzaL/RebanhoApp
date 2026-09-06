// Wrapper mínimo de IndexedDB.
//
// O oplog cresce (fotos de comprovante viram data URLs) e o localStorage
// estoura em ~5 MB. IndexedDB aguenta ordens de grandeza mais e é assíncrono,
// então não trava a interface enquanto grava.

const DB_NAME = 'rebanho-sync'
const DB_VERSION = 1
const STORE_OPS = 'ops'
const STORE_META = 'meta'

let conexao: Promise<IDBDatabase> | null = null

function abrir(): Promise<IDBDatabase> {
  if (conexao) return conexao
  conexao = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const bd = req.result
      if (!bd.objectStoreNames.contains(STORE_OPS)) {
        bd.createObjectStore(STORE_OPS, { keyPath: 'id' })
      }
      if (!bd.objectStoreNames.contains(STORE_META)) {
        bd.createObjectStore(STORE_META)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return conexao
}

function promessa<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Indica se o navegador oferece IndexedDB (Safari privado antigo não oferece). */
export function temIdb(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

export async function lerTodasOps<T>(): Promise<T[]> {
  const bd = await abrir()
  const tx = bd.transaction(STORE_OPS, 'readonly')
  return promessa(tx.objectStore(STORE_OPS).getAll() as IDBRequest<T[]>)
}

export async function gravarOps<T>(ops: T[]): Promise<void> {
  if (!ops.length) return
  const bd = await abrir()
  await new Promise<void>((resolve, reject) => {
    const tx = bd.transaction(STORE_OPS, 'readwrite')
    const store = tx.objectStore(STORE_OPS)
    for (const op of ops) store.put(op)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function limparOps(): Promise<void> {
  const bd = await abrir()
  await new Promise<void>((resolve, reject) => {
    const tx = bd.transaction(STORE_OPS, 'readwrite')
    tx.objectStore(STORE_OPS).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function lerMeta<T>(chave: string): Promise<T | undefined> {
  const bd = await abrir()
  const tx = bd.transaction(STORE_META, 'readonly')
  return promessa(tx.objectStore(STORE_META).get(chave) as IDBRequest<T | undefined>)
}

export async function gravarMeta(chave: string, valor: unknown): Promise<void> {
  const bd = await abrir()
  await new Promise<void>((resolve, reject) => {
    const tx = bd.transaction(STORE_META, 'readwrite')
    tx.objectStore(STORE_META).put(valor, chave)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
