import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RoleGuard } from '@/app/guards'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { useSession } from '@/store/session'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { LockScreen } from '@/features/auth/lock-screen'
import { LoginPage } from '@/features/auth/login-page'
import { HomeRouter } from '@/features/home/home-router'
import { EntradasPage } from '@/features/entradas/entradas-page'
import { SaidasPage } from '@/features/saidas/saidas-page'
import { ContasPage } from '@/features/contas/contas-page'
import { RelatoriosPage } from '@/features/relatorios/relatorios-page'
import { MembrosPage } from '@/features/membros/membros-page'
import { MembroDetalhePage } from '@/features/membros/membro-detalhe-page'
import { AniversariantesPage } from '@/features/membros/aniversariantes-page'
import { AtividadePage } from '@/features/atividade/atividade-page'
import { FundosPage } from '@/features/fundos/fundos-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { StyleGuidePage } from '@/features/styleguide/styleguide-page'
import { LancamentosPage } from '@/features/lancamentos/lancamentos-page'
import { EntradaFormPage } from '@/features/lancamentos/entrada-form-page'
import { DespesaFormPage } from '@/features/lancamentos/despesa-form-page'
import { ContaFormPage } from '@/features/lancamentos/conta-form-page'
import { CultoPage } from '@/features/tesoureiro/culto-page'
import { PrestacaoPage } from '@/features/irmao/prestacao-page'
import { ContribuirPage } from '@/features/irmao/contribuir-page'
import { MinhaContribuicaoPage } from '@/features/irmao/minha-contribuicao-page'

export default function App() {
  const locked = useSession((s) => s.locked)
  if (locked) return <LockScreen />
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomeRouter />} />
          <Route path="entradas" element={<EntradasPage />} />
          <Route path="saidas" element={<SaidasPage />} />
          <Route path="contas" element={<ContasPage />} />
          <Route path="fundos" element={<FundosPage />} />
          <Route path="config" element={<SettingsPage />} />
          <Route path="style" element={<StyleGuidePage />} />

          {/* Irmãos (transparência) */}
          <Route path="gastos" element={<PrestacaoPage />} />
          <Route path="contribuir" element={<ContribuirPage />} />
          <Route path="minha" element={<MinhaContribuicaoPage />} />

          {/* Pastor / Tesoureiro */}
          <Route
            path="relatorios"
            element={
              <RoleGuard allow={['pastor', 'tesoureiro']}>
                <RelatoriosPage />
              </RoleGuard>
            }
          />
          <Route
            path="membros"
            element={
              <RoleGuard allow={['pastor', 'tesoureiro']}>
                <MembrosPage />
              </RoleGuard>
            }
          />
          <Route
            path="membros/:id"
            element={
              <RoleGuard allow={['pastor', 'tesoureiro']}>
                <MembroDetalhePage />
              </RoleGuard>
            }
          />
          <Route
            path="aniversariantes"
            element={
              <RoleGuard allow={['pastor', 'tesoureiro']}>
                <AniversariantesPage />
              </RoleGuard>
            }
          />
          <Route
            path="atividade"
            element={
              <RoleGuard allow={['pastor', 'tesoureiro']}>
                <AtividadePage />
              </RoleGuard>
            }
          />

          {/* Tesoureiro */}
          <Route
            path="lancamentos"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <LancamentosPage />
              </RoleGuard>
            }
          />
          <Route
            path="novo/dizimo"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <EntradaFormPage tipo="dizimo" />
              </RoleGuard>
            }
          />
          <Route
            path="novo/oferta"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <EntradaFormPage tipo="oferta" />
              </RoleGuard>
            }
          />
          <Route
            path="novo/despesa"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <DespesaFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="novo/conta"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <ContaFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="culto"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <CultoPage />
              </RoleGuard>
            }
          />
          <Route
            path="editar/entrada/:id"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <EntradaFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="editar/despesa/:id"
            element={
              <RoleGuard allow={['tesoureiro']}>
                <DespesaFormPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
      <Toaster />
    </>
  )
}
