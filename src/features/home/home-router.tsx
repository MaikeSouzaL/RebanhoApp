import { useSession } from '@/store/session'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { TesoureiroHomePage } from '@/features/tesoureiro/home-page'
import { IrmaoHomePage } from '@/features/irmao/home-page'

/** A rota "/" mostra a home conforme o papel do usuário. */
export function HomeRouter() {
  const papel = useSession((s) => s.user?.papel)
  if (papel === 'tesoureiro') return <TesoureiroHomePage />
  if (papel === 'irmao') return <IrmaoHomePage />
  return <DashboardPage />
}
