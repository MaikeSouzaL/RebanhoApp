import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/store/session'
import type { Papel } from '@/data/types'

/** Exige usuário logado; senão manda para o login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useSession((s) => s.user)
  const carregando = useSession((s) => s.carregando)
  const location = useLocation()
  // Enquanto o log é lido do disco ainda não se sabe quem está logado —
  // redirecionar aqui jogaria a pessoa para o login a cada abertura do app.
  if (carregando) return <TelaCarregando />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function TelaCarregando() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  )
}

/** Restringe uma rota a papéis específicos; senão redireciona para a home. */
export function RoleGuard({ allow, children }: { allow: Papel[]; children: React.ReactNode }) {
  const papel = useSession((s) => s.papelAtivo)
  const ehDono = useSession((s) => s.ehDono)
  // O dono alcança qualquer tela — é a conta de manutenção do app.
  if (ehDono) return <>{children}</>
  if (!papel || !allow.includes(papel)) return <Navigate to="/" replace />
  return <>{children}</>
}
