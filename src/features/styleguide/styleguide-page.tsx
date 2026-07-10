import { Flame, HandCoins } from 'lucide-react'
import { Emblem, Logomark, Wordmark } from '@/components/brand/logo'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/status-badge'

const CORES: { nome: string; token: string; hex: string; cls: string; ring?: boolean }[] = [
  { nome: 'Fundo', token: 'background', hex: '#F7F4EC', cls: 'bg-background', ring: true },
  { nome: 'Superfície', token: 'card', hex: '#FFFFFF', cls: 'bg-card', ring: true },
  { nome: 'Ação (Verde Rebanho)', token: 'primary', hex: '#1E7D3A', cls: 'bg-primary' },
  { nome: 'Verde do anel', token: 'brand-green', hex: '#2FA24B', cls: 'bg-brand-green' },
  { nome: 'Azul Pastor', token: 'brand-blue', hex: '#3B79B0', cls: 'bg-brand-blue' },
  { nome: 'Ouro da chama', token: 'brand-gold', hex: '#F6C136', cls: 'bg-brand-gold' },
  { nome: 'Sucesso / entrada', token: 'success', hex: '#1E7D3A', cls: 'bg-success' },
  { nome: 'Alerta / vencendo', token: 'warning', hex: '#E8992B', cls: 'bg-warning' },
  { nome: 'Erro / atrasado', token: 'destructive', hex: '#D8382A', cls: 'bg-destructive' },
  { nome: 'Couro (cajado)', token: 'leather', hex: '#8A5A2B', cls: 'bg-leather' },
]

const CHART = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

export function StyleGuidePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Style Guide" subtitle="Identidade visual — nascida da logo do Bom Pastor" />

      {/* Marca */}
      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Emblem size={72} />
            <Logomark size={56} />
            <Wordmark />
          </div>
          <p className="text-sm text-muted-foreground">
            Emblema real, marca compacta (anel verde + chama pentecostal + cajado) e o wordmark. A
            personalidade é <strong>sagrada, acolhedora e transparente</strong>.
          </p>
          <div className="bg-flame-glow flex items-center gap-3 rounded-2xl border border-border p-4">
            <Flame className="size-6 text-flame-via" style={{ color: 'var(--flame-via)' }} />
            <div>
              <p className="text-flame font-display text-lg font-semibold">Chama pentecostal</p>
              <p className="text-xs text-muted-foreground">.text-flame · .bg-flame · .bg-flame-glow</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CORES.map((c) => (
              <div key={c.token} className="flex items-center gap-3">
                <div
                  className={`size-11 shrink-0 rounded-xl ${c.cls} ${c.ring ? 'ring-1 ring-border' : ''}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.nome}</p>
                  <p className="tabular text-xs text-muted-foreground">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Séries de gráfico</p>
            <div className="flex gap-2">
              {CHART.map((c) => (
                <div key={c} className={`h-10 flex-1 rounded-lg ${c}`} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipografia */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Fraunces — títulos</p>
            <h1 className="font-display text-3xl font-semibold">Prestação de contas</h1>
            <h3 className="font-display text-xl font-semibold">O rebanho floresce</h3>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Plus Jakarta Sans — corpo</p>
            <p className="text-sm">
              Interface clara e amigável para o dia a dia da tesouraria e do pastor.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Números tabulares (.tabular)</p>
            <p className="tabular text-2xl font-semibold text-primary">R$ 12.480,00</p>
          </div>
        </CardContent>
      </Card>

      {/* Componentes */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Ação</Button>
            <Button variant="flame">
              <HandCoins /> Chama
            </Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="destructive">Excluir</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Dízimo</Badge>
            <Badge variant="info">Oferta</Badge>
            <Badge variant="gold">Missões</Badge>
            <Badge variant="success">Superávit</Badge>
            <Badge variant="warning">Atenção</Badge>
            <Badge variant="danger">Déficit</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="pago" />
            <StatusBadge status="pendente" />
            <StatusBadge status="atrasado" />
          </div>
          <Input placeholder="Campo de entrada…" />
        </CardContent>
      </Card>
    </div>
  )
}
