import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, LogIn, Wifi } from 'lucide-react'
import { Emblem } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useData } from '@/store/data'
import { useRede } from '@/store/rede'
import { useSession } from '@/store/session'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, user, carregando, sincronizando } = useSession()
  const config = useData((s) => s.config)
  const totalCadastros = useData((s) => s.usuarios.length)
  const status = useRede((s) => s.status)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (user) return <Navigate to="/" replace />
  if (carregando) return null

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const res = await login(email, senha)
    setEnviando(false)
    if (res.ok) {
      toast.success('Bem-vindo de volta!')
      navigate('/', { replace: true })
    } else {
      toast.error(res.erro ?? 'Não foi possível entrar.')
    }
  }

  return (
    <div className="bg-flame-glow relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute -top-24 right-[-20%] size-72 rounded-full bg-primary/10 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-card p-1.5 shadow-warm ring-1 ring-border">
            <Emblem size={104} />
          </div>
          <h1 className="mt-4 font-display text-[26px] font-semibold leading-tight">
            {config.nome || 'O Rebanho de Jesus Cristo'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão financeira da igreja</p>
        </div>

        <form
          onSubmit={entrar}
          className="mt-7 space-y-4 rounded-3xl border border-border bg-card/90 p-5 shadow-warm backdrop-blur"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {sincronizando ? <Loader2 className="animate-spin" /> : <LogIn />}
            {sincronizando ? 'Procurando seu cadastro…' : enviando ? 'Entrando…' : 'Entrar'}
          </Button>

          {sincronizando && (
            <p className="text-center text-xs text-muted-foreground">
              Primeiro acesso neste aparelho: buscando seus dados nos outros aparelhos da igreja.
              Isso pode levar até um minuto.
            </p>
          )}

          {/* Sem nenhum cadastro local a pessoa precisa saber que é questão de
              sincronizar (ou de ser a primeira), não que os dados sumiram. */}
          {totalCadastros === 0 && (
            <p className="flex items-start gap-1.5 rounded-xl bg-secondary/60 p-2.5 text-xs text-muted-foreground">
              <Wifi className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Nenhum cadastro neste aparelho ainda.{' '}
                {status === 'conectado'
                  ? 'Sincronizando com a igreja…'
                  : 'Deixe o app aberto para encontrar outro aparelho, ou crie seu cadastro.'}
              </span>
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem acesso?{' '}
          <Link to="/cadastro" className="font-semibold text-primary underline-offset-4 hover:underline">
            Criar cadastro
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
