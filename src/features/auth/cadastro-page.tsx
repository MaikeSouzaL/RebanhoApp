import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Church, Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { Emblem } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/store/session'
import { GoogleButton } from '@/components/shared/google-button'
import { toast } from 'sonner'

export function CadastroPage() {
  const navigate = useNavigate()
  const { cadastrar, user, carregando } = useSession()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  // `null` enquanto não sabemos; evita prometer "você será o pastor" à toa.
  const [temPastor, setTemPastor] = useState<boolean | null>(null)

  useEffect(() => {
    let vivo = true
    void supabase.rpc('existe_pastor').then(({ data }) => {
      if (vivo) setTemPastor(data === true)
    })
    return () => {
      vivo = false
    }
  }, [])

  if (user) return <Navigate to="/" replace />
  if (carregando) return null

  const seraPastor = temPastor === false

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const res = await cadastrar({ nome, email, senha })
    setEnviando(false)
    if (res.ok) {
      toast.success(seraPastor ? 'Igreja criada! Você é o pastor.' : 'Cadastro concluído.')
      navigate('/', { replace: true })
    } else {
      toast.error(res.erro ?? 'Não foi possível concluir o cadastro.')
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
            <Emblem size={92} />
          </div>
          <h1 className="mt-4 font-display text-[24px] font-semibold leading-tight">
            Criar cadastro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">O Rebanho de Jesus Cristo</p>
        </div>

        <form
          onSubmit={enviar}
          className="mt-6 space-y-4 rounded-3xl border border-border bg-card/90 p-5 shadow-warm backdrop-blur"
        >
          {temPastor !== null && (
            <div
              className={
                'flex items-start gap-2.5 rounded-2xl border border-dashed p-3 text-sm ' +
                (seraPastor
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border bg-secondary/40 text-muted-foreground')
              }
            >
              {seraPastor ? (
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Church className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                {seraPastor
                  ? 'Este é o primeiro cadastro da igreja — você entra como pastor e passa a definir os acessos dos demais.'
                  : 'Seu cadastro entra como membro da igreja. O pastor pode torná-lo tesoureiro depois.'}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como você é conhecido na igreja"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Ao menos 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <UserPlus />}
            {enviando ? 'Criando…' : 'Criar cadastro'}
          </Button>

          <GoogleButton texto="Cadastrar com Google" />
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem cadastro?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
