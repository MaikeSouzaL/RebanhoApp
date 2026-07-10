import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/store/session'
import type { Papel } from '@/data/types'

/** Exige usuário logado; senão manda para o login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useSession((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

/** Restringe uma rota a papéis específicos; senão redireciona para a home. */
export function RoleGuard({ allow, children }: { allow: Papel[]; children: React.ReactNode }) {
  const papel = useSession((s) => s.user?.papel)
  if (!papel || !allow.includes(papel)) return <Navigate to="/" replace />
  return <>{children}</>
}
