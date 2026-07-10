import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, ShieldCheck, Users, Wallet } from 'lucide-react'
import { Emblem } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/store/session'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginAs, user } = useSession()
  const [email, setEmail] = useState('pastor@rebanho.app')
  const [senha, setSenha] = useState('rebanho123')

  if (user) return <Navigate to="/" replace />


  function entrar(e: React.FormEvent) {
    e.preventDefault()
    const res = login(email, senha)
    if (res.ok) {
      toast.success('Bem-vindo de volta!')
      navigate('/', { replace: true })
    } else {
      toast.error(res.erro ?? 'Não foi possível entrar.')
    }
  }

  function demo(papel: 'pastor' | 'tesoureiro' | 'irmao') {
    loginAs(papel)
    navigate('/', { replace: true })
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
            O Rebanho de Jesus Cristo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Igreja Pentecostal · 1990 — Gestão financeira
          </p>
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
              placeholder="voce@rebanho.app"
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
          <Button type="submit" size="lg" className="w-full">
            <LogIn />
            Entrar
          </Button>
        </form>

        <p className="mt-5 mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Entrar em demonstração como
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => demo('pastor')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-3 text-xs font-semibold text-primary active:scale-[0.99]"
          >
            <ShieldCheck className="size-5" />
            Pastor
          </button>
          <button
            onClick={() => demo('tesoureiro')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-3 text-xs font-semibold text-info active:scale-[0.99]"
          >
            <Wallet className="size-5" />
            Tesoureiro
          </button>
          <button
            onClick={() => demo('irmao')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-3 text-xs font-semibold text-[color:var(--flame-via)] active:scale-[0.99]"
          >
            <Users className="size-5" />
            Irmão
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Três experiências por papel — cada um vê o que precisa.
        </p>
      </motion.div>
    </div>
  )
}
