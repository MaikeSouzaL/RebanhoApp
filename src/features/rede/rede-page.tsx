import { useRef, useState } from 'react'
import {
  Download,
  Laptop,
  RefreshCw,
  Share2,
  Smartphone,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useRede } from '@/store/rede'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { idDispositivo, nomeAparelho } from '@/sync/identidade'
import { exportarLog, importarLog } from '@/sync/motor'
import type { Op } from '@/sync/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function RedePage() {
  const { status, pares, totalOps, rejeitadas, ultimaTroca, erro, criptografia, conectar, desconectar, ressincronizar } =
    useRede()
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)

  const conectado = status === 'conectado'
  const procurando = status === 'procurando'

  /** Plano B para quando os aparelhos nunca ficam abertos ao mesmo tempo. */
  function exportarArquivo() {
    const ops = exportarLog()
    const blob = new Blob([JSON.stringify(ops)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rebanho-sync-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${ops.length} registros exportados.`)
  }

  async function importarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    try {
      const ops = JSON.parse(await file.text()) as Op[]
      if (!Array.isArray(ops)) throw new Error('formato')
      const novas = await importarLog(ops)
      toast.success(novas ? `${novas} registros novos aplicados.` : 'Nada novo neste arquivo.')
    } catch {
      toast.error('Arquivo inválido.')
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rede da igreja"
        subtitle="Os aparelhos conversam entre si e mantêm os mesmos dados"
      />

      {!criptografia && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5 text-sm">
            Este endereço não é seguro (https). Sem conexão segura o navegador não libera a
            criptografia, então a rede fica desligada e o app funciona só neste aparelho.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-2xl',
                conectado ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground',
              )}
            >
              {conectado ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
            </span>
            <div className="flex-1">
              <p className="font-display text-base font-semibold">
                {conectado
                  ? `${pares.length} aparelho(s) conectado(s)`
                  : procurando
                    ? 'Procurando aparelhos…'
                    : 'Desconectado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {ultimaTroca
                  ? `Última troca às ${new Date(ultimaTroca).toLocaleTimeString('pt-BR')}`
                  : 'Nenhuma troca ainda nesta sessão'}
              </p>
            </div>
          </div>

          {erro && <p className="text-xs text-destructive">{erro}</p>}

          <div className="grid grid-cols-2 gap-2">
            {conectado || procurando ? (
              <Button variant="secondary" onClick={desconectar}>
                <WifiOff />
                Desconectar
              </Button>
            ) : (
              <Button onClick={() => conectar()} disabled={!criptografia}>
                <Wifi />
                Conectar
              </Button>
            )}
            <Button variant="secondary" onClick={ressincronizar} disabled={!conectado}>
              <RefreshCw />
              Sincronizar
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/60 p-3 text-center">
            <div>
              <p className="tabular font-display text-lg font-semibold">{totalOps}</p>
              <p className="text-[11px] text-muted-foreground">registros</p>
            </div>
            <div>
              <p className="tabular font-display text-lg font-semibold">{pares.length}</p>
              <p className="text-[11px] text-muted-foreground">aparelhos</p>
            </div>
            <div>
              <p className="tabular font-display text-lg font-semibold">{rejeitadas}</p>
              <p className="text-[11px] text-muted-foreground">recusados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparelhos conectados</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {pares.length ? (
            <div className="divide-y divide-border">
              {pares.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <Smartphone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.nome ?? 'Aparelho'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.papel ?? '—'} · conectado desde{' '}
                      {new Date(p.desde).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="secondary">Online</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Share2}
              title="Ninguém online agora"
              description="Os aparelhos só trocam dados com o aplicativo aberto nos dois lados. Peça a alguém que abra o app."
            />
          )}
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-card text-muted-foreground">
              <Laptop className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Este aparelho · {nomeAparelho()}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {idDispositivo()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transferir por arquivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground">
            Quando dois aparelhos nunca ficam abertos ao mesmo tempo, exporte aqui e importe no
            outro. O resultado é o mesmo da sincronização automática — nada se perde e nada se
            duplica.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={exportarArquivo}>
              <Download />
              Exportar
            </Button>
            <Button variant="secondary" onClick={() => arquivoRef.current?.click()} disabled={importando}>
              <Upload />
              {importando ? 'Importando…' : 'Importar'}
            </Button>
          </div>
          <input
            ref={arquivoRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importarArquivo}
          />
        </CardContent>
      </Card>
    </div>
  )
}
