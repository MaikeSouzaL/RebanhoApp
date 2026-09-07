// Gerador de Pix "Copia e Cola" (BR Code estatico, padrao EMV do Banco Central).
//
// A chave sozinha nao e paga por leitura de QR nos apps de banco — eles esperam
// este payload (com nome do recebedor, cidade e um CRC no fim). Monta-lo aqui
// deixa o QR da tela de contribuir realmente escaneavel e o texto pronto para
// colar no app do banco.

/** Um campo EMV: id + tamanho (2 digitos) + valor. */
function campo(id: string, valor: string): string {
  const tam = valor.length.toString().padStart(2, '0')
  return `${id}${tam}${valor}`
}

/**
 * Remove acentos e limita — nome e cidade do BR Code sao ASCII e curtos.
 * O NFD separa a letra do acento; o filtro seguinte descarta o acento (que
 * nao e A-Z0-9) junto com qualquer outro simbolo.
 */
function limpar(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)
}

/** CRC16-CCITT (polinomio 0x1021, inicio 0xFFFF) — exigido no fim do payload. */
function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface DadosPix {
  chave: string
  nome: string
  cidade: string
  /** Valor fixo (opcional). Dizimo/oferta costuma ficar em branco. */
  valor?: number
}

/**
 * Monta o Pix Copia e Cola. Retorna string vazia se nao houver chave —
 * a tela usa isso para esconder o QR ate o pastor configurar.
 */
export function montarPixCopiaECola({ chave, nome, cidade, valor }: DadosPix): string {
  const key = chave.trim()
  if (!key) return ''

  const mai = campo('00', 'br.gov.bcb.pix') + campo('01', key)
  const partes = [
    campo('00', '01'), // formato
    campo('26', mai), // conta do recebedor (Pix)
    campo('52', '0000'), // categoria do estabelecimento
    campo('53', '986'), // moeda: BRL
    ...(valor && valor > 0 ? [campo('54', valor.toFixed(2))] : []),
    campo('58', 'BR'), // pais
    campo('59', limpar(nome, 25) || 'RECEBEDOR'), // nome do recebedor
    campo('60', limpar(cidade, 15) || 'BRASIL'), // cidade
    campo('62', campo('05', '***')), // sem txid
  ]
  const semCrc = partes.join('') + '6304'
  return semCrc + crc16(semCrc)
}

/** Tipos de chave que o pastor pode escolher. */
export const TIPOS_PIX = ['CNPJ', 'CPF', 'E-mail', 'Telefone', 'Aleatoria'] as const
