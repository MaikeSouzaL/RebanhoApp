import { forwardRef } from 'react'
import type { ConfigIgreja } from '@/data/types'
import { formatBRL, formatDate } from '@/lib/format'

export interface ReciboData {
  config: ConfigIgreja
  membro: string
  ano: number
  meses: { label: string; valor: number }[]
  totalAno: number
  totalDizimo: number
  totalOferta: number
}

const INK = '#1b1b1b'
const MUTED = '#5c5c5c'
const LINE = '#e0ddd3'
const GREEN = '#1e7d3a'

/** Recibo/comprovante anual de contribuições (impressão / PDF). */
export const ReciboDocument = forwardRef<HTMLDivElement, { data: ReciboData }>(function ReciboDocument(
  { data },
  ref,
) {
  const { config } = data
  return (
    <div
      ref={ref}
      className="print-area report-doc"
      style={{
        width: 794,
        minHeight: 1050,
        background: '#ffffff',
        color: INK,
        padding: '52px 56px',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        lineHeight: 1.6,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: `2px solid ${GREEN}`, paddingBottom: 16 }}>
        <img src="/emblema.png" alt="" width={72} height={72} style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>{config.razaoSocial}</h1>
          <p style={{ margin: '2px 0 0', color: MUTED, fontSize: 12 }}>
            CNPJ {config.cnpj} · {config.endereco} · {config.cidade}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>RECIBO DE CONTRIBUIÇÕES</p>
          <p style={{ margin: '2px 0 0', color: MUTED, fontSize: 12 }}>Exercício {data.ano}</p>
        </div>
      </div>

      <p style={{ marginTop: 28 }}>
        Declaramos, para os devidos fins, que <strong>{data.membro}</strong> contribuiu com dízimos e
        ofertas nesta igreja durante o exercício de <strong>{data.ano}</strong>, conforme discriminado
        abaixo, totalizando o valor de <strong>{formatBRL(data.totalAno)}</strong>.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, margin: '24px 0 8px', color: GREEN, borderBottom: `2px solid ${GREEN}`, paddingBottom: 4 }}>
        Contribuições por mês
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
        {data.meses.map((mes) => (
          <div key={mes.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${LINE}`, textTransform: 'capitalize' }}>
            <span>{mes.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: mes.valor > 0 ? INK : MUTED }}>
              {formatBRL(mes.valor)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>Dízimos</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(data.totalDizimo)}</p>
        </div>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>Ofertas</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(data.totalOferta)}</p>
        </div>
        <div style={{ border: `2px solid ${GREEN}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, color: GREEN, fontSize: 11 }}>Total no ano</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(data.totalAno)}</p>
        </div>
      </div>

      <div style={{ marginTop: 64, display: 'flex', gap: 40, justifyContent: 'space-between' }}>
        {['Tesoureiro(a)', config.pastor].map((label) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6, fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: MUTED, textAlign: 'center' }}>
        {config.cidade}, {formatDate(new Date())}. Documento sem valor fiscal, emitido para
        comprovação de contribuições voluntárias.
      </p>
    </div>
  )
})
