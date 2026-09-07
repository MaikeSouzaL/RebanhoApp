import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { setAuditUser } from '@/data/services'
import { desligarTempoReal, ligarTempoReal, useData } from '@/store/data'
import type { Papel, Usuario } from '@/data/types'
import { ehEmailDono, PAPEIS_DEUS, papeisDoUsuario } from '@/lib/papeis'
import { getStoredTheme, setTheme as applyStoredTheme, type Theme } from '@/lib/theme'
import { hasPin, verifyPin } from '@/lib/prefs'
import { monthPeriod, type Period } from '@/lib/report'

const PAPEL_ATIVO_KEY = 'rebanho-papel-ativo'

export interface Resultado {
  ok: boolean
  erro?: string
}

interface DadosCadastro {
  nome: string
  email: string
  senha: string
}

interface EstadoPapel {
  ehDono: boolean
  papeisDisponiveis: Papel[]
  papelAtivo: Papel
}

/**
 * Papéis do usuário logado.
 *
 * Uma pessoa pode acumular papéis (pastor E tesoureiro) e alternar entre eles;
 * o dono navega por todos. `papelAtivo` é o papel em uso agora — de preferência
 * o que ficou salvo, senão o principal.
 */
function estadoDePapel(user: Usuario | null): EstadoPapel {
  if (!user) return { ehDono: false, papeisDisponiveis: ['irmao'], papelAtivo: 'irmao' }
  const ehDono = ehEmailDono(user.email)
  const papeisDisponiveis = ehDono ? PAPEIS_DEUS : papeisDoUsuario(user)
  const salvo = localStorage.getItem(PAPEL_ATIVO_KEY) as Papel | null
  const papelAtivo =
    salvo && papeisDisponiveis.includes(salvo) ? salvo : (papeisDisponiveis[0] ?? 'irmao')
  return { ehDono, papeisDisponiveis, papelAtivo }
}

interface SessionState {
  user: Usuario | null
  /** Conta de manutenção do dono (acesso total, oculta das listas). */
  ehDono: boolean
  papeisDisponiveis: Papel[]
  papelAtivo: Papel
  theme: Theme
  period: Period
  locked: boolean
  /** Verdadeiro enquanto a sessão está sendo restaurada. */
  carregando: boolean

  iniciar: () => Promise<void>
  cadastrar: (dados: DadosCadastro) => Promise<Resultado>
  login: (email: string, senha: string) => Promise<Resultado>
  entrarComGoogle: () => Promise<Resultado>
  logout: () => Promise<void>
  entrarComoPapel: (papel: Papel) => void
  setTheme: (t: Theme) => void
  setPeriod: (p: Period) => void
  unlock: (pin: string) => boolean
  lock: () => void
}

/** Traduz os erros do Supabase Auth para algo que a pessoa entenda. */
function mensagemDeErro(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar.'
  if (/already registered|already exists/i.test(msg)) return 'Já existe uma conta com este e-mail.'
  if (/Password should be at least/i.test(msg)) return 'A senha precisa de ao menos 6 caracteres.'
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas. Aguarde um instante.'
  if (/fetch|network/i.test(msg)) return 'Sem conexão com o servidor da igreja.'
  return msg
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  ehDono: false,
  papeisDisponiveis: ['irmao'],
  papelAtivo: 'irmao',
  theme: getStoredTheme() ?? 'light',
  period: monthPeriod(),
  locked: hasPin(),
  carregando: true,

  /** Restaura a sessão salva e carrega os dados da igreja. */
  iniciar: async () => {
    const { data } = await supabase.auth.getSession()

    async function aplicarSessao(uid: string | null) {
      if (!uid) {
        desligarTempoReal()
        set({ user: null, ...estadoDePapel(null), carregando: false })
        return
      }
      await useData.getState().recarregar()
      const perfil = useData.getState().usuarios.find((u) => u.id === uid) ?? null
      if (perfil) setAuditUser(perfil.nome)
      ligarTempoReal()
      set({ user: perfil, ...estadoDePapel(perfil), carregando: false })
    }

    await aplicarSessao(data.session?.user.id ?? null)

    // Login, logout e renovação de token chegam por aqui — inclusive quando
    // acontecem em outra aba do mesmo navegador.
    supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_OUT') void aplicarSessao(null)
      else if (evento === 'SIGNED_IN') void aplicarSessao(sessao?.user.id ?? null)
    })

    // O papel pode mudar enquanto a pessoa usa o app (o pastor promoveu
    // alguém): quando a lista de usuários muda, revemos o papel do logado.
    useData.subscribe(() => {
      const atual = get().user
      if (!atual) return
      const novo = useData.getState().usuarios.find((u) => u.id === atual.id)
      if (!novo) return
      const mudou =
        JSON.stringify(papeisDoUsuario(novo)) !== JSON.stringify(papeisDoUsuario(atual)) ||
        novo.nome !== atual.nome ||
        novo.cargo !== atual.cargo
      if (!mudou) return
      setAuditUser(novo.nome)
      const estado = estadoDePapel(novo)
      const manter = estado.papeisDisponiveis.includes(get().papelAtivo)
      set({
        user: novo,
        ehDono: estado.ehDono,
        papeisDisponiveis: estado.papeisDisponiveis,
        papelAtivo: manter ? get().papelAtivo : estado.papelAtivo,
      })
    })
  },

  cadastrar: async ({ nome, email, senha }) => {
    if (nome.trim().length < 3) return { ok: false, erro: 'Informe o nome completo.' }
    if (senha.length < 6) return { ok: false, erro: 'A senha precisa de ao menos 6 caracteres.' }

    // Quem é pastor e quem é membro é decidido no banco (o primeiro cadastro
    // vira pastor); o app só informa o nome.
    const limpo = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: limpo,
      password: senha,
      options: { data: { nome: nome.trim() } },
    })
    if (error) return { ok: false, erro: mensagemDeErro(error.message) }

    // O e-mail já é confirmado no banco (gatilho), então o cadastro entra
    // direto. Se por algum motivo o signUp não trouxe sessão, fazemos o login
    // na hora — a pessoa nunca precisa esperar um e-mail.
    let uid = data.session?.user.id ?? null
    if (!data.session) {
      const entrada = await supabase.auth.signInWithPassword({ email: limpo, password: senha })
      if (entrada.error) {
        return {
          ok: false,
          erro: 'Conta criada. Agora entre com seu e-mail e senha.',
        }
      }
      uid = entrada.data.user.id
    }

    await useData.getState().recarregar()
    const perfil = useData.getState().usuarios.find((u) => u.id === uid) ?? null
    if (perfil) setAuditUser(perfil.nome)
    ligarTempoReal()
    set({ user: perfil, ...estadoDePapel(perfil) })
    return { ok: true }
  },

  login: async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    if (error) return { ok: false, erro: mensagemDeErro(error.message) }

    await useData.getState().recarregar()
    const perfil = useData.getState().usuarios.find((u) => u.id === data.user.id) ?? null
    if (perfil) setAuditUser(perfil.nome)
    ligarTempoReal()
    set({ user: perfil, ...estadoDePapel(perfil) })
    return { ok: true }
  },

  /**
   * Entra com a conta Google. Redireciona para o Google e volta para o app já
   * logado — o `onAuthStateChange` (em `iniciar`) cuida do resto quando a
   * página recarrega. Exige o provedor Google ligado no painel do Supabase.
   */
  entrarComGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      if (/provider is not enabled|not enabled/i.test(error.message)) {
        return { ok: false, erro: 'Login com Google ainda não está ativado no servidor.' }
      }
      return { ok: false, erro: mensagemDeErro(error.message) }
    }
    // A navegação para o Google acontece aqui; a resposta abaixo raramente é
    // usada, mas mantém a assinatura consistente.
    return { ok: true }
  },

  logout: async () => {
    desligarTempoReal()
    await supabase.auth.signOut()
    set({ user: null, ehDono: false, papeisDisponiveis: ['irmao'], papelAtivo: 'irmao' })
  },

  entrarComoPapel: (papel) => {
    if (!get().papeisDisponiveis.includes(papel)) return
    localStorage.setItem(PAPEL_ATIVO_KEY, papel)
    set({ papelAtivo: papel })
  },

  setTheme: (t) => {
    applyStoredTheme(t)
    set({ theme: t })
  },
  setPeriod: (p) => set({ period: p }),
  unlock: (pin) => {
    if (verifyPin(pin)) {
      set({ locked: false })
      return true
    }
    return false
  },
  lock: () => set({ locked: true }),
}))
