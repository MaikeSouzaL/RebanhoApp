import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBRL } from '@/lib/format'

const axis = { fontSize: 11, fill: 'var(--muted-foreground)' }

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {children}
    </div>
  )
}

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 190,
}: {
  data: DonutDatum[]
  centerLabel?: string
  centerValue?: string
  height?: number
}) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="100%"
            paddingAngle={2}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TooltipBox>
                  <p className="font-semibold">{payload[0]!.name}</p>
                  <p className="tabular text-muted-foreground">
                    {formatBRL(payload[0]!.value as number)}
                    {total > 0 && ` · ${Math.round(((payload[0]!.value as number) / total) * 100)}%`}
                  </p>
                </TooltipBox>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="tabular font-display text-lg font-semibold">{centerValue}</span>}
          {centerLabel && <span className="text-[11px] text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

export interface FlowDatum {
  label: string
  entradas: number
  saidas: number
  saldo: number
}

export function CashflowChart({ data, height = 220 }: { data: FlowDatum[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} className="capitalize" />
          <YAxis
            tick={axis}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatBRL(v as number, { compact: true }).replace('R$', '')}
          />
          <Tooltip
            cursor={{ fill: 'color-mix(in oklab, var(--muted) 60%, transparent)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox>
                  <p className="mb-1 font-semibold capitalize">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey} className="flex items-center gap-1.5 tabular">
                      <span className="size-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted-foreground">
                        {p.dataKey === 'entradas' ? 'Entradas' : p.dataKey === 'saidas' ? 'Saídas' : 'Saldo'}:
                      </span>
                      {formatBRL(p.value as number)}
                    </p>
                  ))}
                </TooltipBox>
              ) : null
            }
          />
          <Bar dataKey="entradas" fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={16} />
          <Bar dataKey="saidas" fill="var(--chart-3)" radius={[5, 5, 0, 0]} maxBarSize={16} />
          <Line
            dataKey="saldo"
            type="monotone"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Sparkline({ data, color = 'var(--primary)', height = 44 }: { data: number[]; color?: string; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey="v" type="monotone" stroke={color} strokeWidth={2} fill="url(#spark)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
