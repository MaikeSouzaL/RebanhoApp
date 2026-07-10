import { forwardRef } from 'react'
import type { CategoriaTotal, FundoSaldo, Period } from '@/lib/report'
import type { ConfigIgreja, ContaPagar } from '@/data/types'
import { CATEGORIA_MAP } from '@/data/categorias'
import { formatBRL, formatDate } from '@/lib/format'

export interface ReportData {
  config: ConfigIgreja
  period: Period
  saldoInicial: number
  totalEntradas: number
  totalSaidas: number
  resultado: number
  saldoFinal: number
  porTipo: { dizimo: number; oferta: number; outra: number }
  saidasCategorias: CategoriaTotal[]
  fundos: FundoSaldo[]
  contasAbertas: ContaPagar[]
  geradoPor: string
}

// Cores fixas (independentes do tema) para impressão/PDF fiéis.
const INK = '#1b1b1b'
const MUTED = '#5c5c5c'
const LINE = '#e0ddd3'
const GREEN = '#1e7d3a'
const RED = '#c0392b'

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: `1px solid ${LINE}`,
        fontWeight: bold ? 700 : 400,
        color: color ?? INK,
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 600,
        margin: '22px 0 8px',
        color: GREEN,
        borderBottom: `2px solid ${GREEN}`,
        paddingBottom: 4,
      }}
    >
      {children}
    </h2>
  )
}

/** Documento A4 de prestação de contas (impressão / PDF). */
export const ReportDocument = forwardRef<HTMLDivElement, { data: ReportData }>(function ReportDocument(
  { data },
  ref,
) {
  const { config, period } = data
  const maxCat = data.saidasCategorias[0]?.total ?? 1

  return (
    <div
      ref={ref}
      className="print-area report-doc"
      style={{
        width: 794,
        minHeight: 1123,
        background: '#ffffff',
        color: INK,
        padding: '48px 52px',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: `2px solid ${GREEN}`, paddingBottom: 16 }}>
        <img src="/emblema.png" alt="" width={72} height={72} style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            {config.razaoSocial}
          </h1>
          <p style={{ margin: '2px 0 0', color: MUTED, fontSize: 12 }}>
            CNPJ {config.cnpj} · {config.endereco} · {config.cidade} · {config.telefone}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>PRESTAÇÃO DE CONTAS</p>
          <p style={{ margin: '2px 0 0', color: MUTED, fontSize: 12 }}>{period.label}</p>
          <p style={{ margin: '2px 0 0', color: MUTED, fontSize: 11 }}>
            {formatDate(period.inicio)} a {formatDate(period.fim)}
          </p>
        </div>
      </div>

      {/* Resumo executivo */}
      <SectionTitle>Resumo do período</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
        <div>
          <Row label="Saldo inicial" value={formatBRL(data.saldoInicial)} />
          <Row label="(+) Total de entradas" value={formatBRL(data.totalEntradas)} color={GREEN} />
          <Row label="(−) Total de saídas" value={formatBRL(data.totalSaidas)} color={RED} />
        </div>
        <div>
          <Row
            label="Resultado do período"
            value={formatBRL(data.resultado)}
            bold
            color={data.resultado >= 0 ? GREEN : RED}
          />
          <Row label="Saldo final em caixa" value={formatBRL(data.saldoFinal)} bold />
          <Row label="Situação" value={data.resultado >= 0 ? 'Superávit' : 'Déficit'} color={data.resultado >= 0 ? GREEN : RED} />
        </div>
      </div>

      {/* Entradas */}
      <SectionTitle>Entradas</SectionTitle>
      <Row label="Dízimos" value={formatBRL(data.porTipo.dizimo)} />
      <Row label="Ofertas (cultos, missões, gratidão…)" value={formatBRL(data.porTipo.oferta)} />
      <Row label="Outras entradas (doações, bazar…)" value={formatBRL(data.porTipo.outra)} />
      <Row label="Total de entradas" value={formatBRL(data.totalEntradas)} bold color={GREEN} />

      {/* Saídas por categoria */}
      <SectionTitle>Saídas por categoria</SectionTitle>
      {data.saidasCategorias.map((c) => {
        const meta = CATEGORIA_MAP[c.categoria]
        return (
          <div key={c.categoria} style={{ padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{meta.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(c.total)}</span>
            </div>
            <div style={{ height: 4, background: '#f0ede4', borderRadius: 3, marginTop: 4 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${(c.total / maxCat) * 100}%`, background: meta.cor }} />
            </div>
          </div>
        )
      })}
      <Row label="Total de saídas" value={formatBRL(data.totalSaidas)} bold color={RED} />

      {/* Fundos */}
      <SectionTitle>Movimentação por fundo</SectionTitle>
      <div style={{ display: 'flex', fontSize: 11, color: MUTED, padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
        <span style={{ flex: 2 }}>Fundo</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Entradas</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Saídas</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Saldo</span>
      </div>
      {data.fundos.map((f) => (
        <div key={f.fundo.id} style={{ display: 'flex', padding: '5px 0', borderBottom: `1px solid ${LINE}`, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ flex: 2 }}>{f.fundo.nome}</span>
          <span style={{ flex: 1, textAlign: 'right', color: GREEN }}>{formatBRL(f.entradas)}</span>
          <span style={{ flex: 1, textAlign: 'right', color: RED }}>{formatBRL(f.saidas)}</span>
          <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{formatBRL(f.saldo)}</span>
        </div>
      ))}

      {/* Contas em aberto */}
      {data.contasAbertas.length > 0 && (
        <>
          <SectionTitle>Contas a pagar em aberto</SectionTitle>
          {data.contasAbertas.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
              <span>
                {c.descricao} <span style={{ color: MUTED }}>· vence {formatDate(c.vencimento)}</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(c.valor)}</span>
            </div>
          ))}
        </>
      )}

      {/* Assinaturas */}
      <div style={{ marginTop: 56, display: 'flex', gap: 40, justifyContent: 'space-between' }}>
        {['Tesoureiro(a)', config.pastor].map((label) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6, fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 32, fontSize: 11, color: MUTED, textAlign: 'center' }}>
        Documento destinado ao Pastor Presidente <strong>{config.pastorPresidente}</strong> · Emitido por{' '}
        {data.geradoPor} em {formatDate(new Date())}.
      </p>
    </div>
  )
})
