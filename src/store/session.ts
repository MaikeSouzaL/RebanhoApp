import { create } from 'zustand'
import { db } from '@/data/db'
import { services, setAuditUser } from '@/data/services'
import type { Papel, Usuario } from '@/data/types'
import { ehEmailDono, PAPEIS_DEUS, papeisDoUsuario } from '@/sync/dono'
import { getStoredTheme, setTheme as applyStoredTheme, type Theme } from '@/lib/theme'
import { hasPin, verifyPin } from '@/lib/prefs'
import { monthPeriod, type Period } from '@/lib/report'
import {
  cifrarComSenha,
  comparaSegura,
  decifrarComSenha,
  gerarParDeChaves,
  hashSenha,
  idAleatorio,
  novoSal,
  temCriptografia,
} from '@/sync/crypto'
import { guardarChave, lerChave, limparChave } from '@/sync/identidade'
import * as motor from '@/sync/motor'

const USER_KEY = 'rebanho-usuario'
const PAPEL_DEUS_KEY = 'rebanho-papel-deus'

export interface Resultado {
  ok: boolean
  erro?: string
}

interface EstadoPapel {
  ehDono: boolean
  /** Papéis pelos quais este usuário pode navegar (o dono navega por todos). */
  papeisDisponiveis: Papel[]
  /** Papel pelo qual a interface se comporta agora. */
  papelAtivo: Papel
}

/**
 * Estado de papel do usuário logado.
 *
 * Um usuário pode acumular papéis (pastor E tesoureiro) e alternar entre eles;
 * o dono navega por todos. `papelAtivo` é o papel em uso no momento — de
 * preferência o que estava salvo, senão o principal.
 */
function estadoDePapel(user: Usuario | null): EstadoPapel {
  if (!user) return { ehDono: false, papeisDisponiveis: ['irmao'], papelAtivo: 'irmao' }
  const ehDono = ehEmailDono(user.email)
  const papeisDisponiveis = ehDono ? PAPEIS_DEUS : papeisDoUsuario(user)
  const salvo = localStorage.getItem(PAPEL_DEUS_KEY) as Papel | null
  const papelAtivo =
    salvo && papeisDisponiveis.includes(salvo) ? salvo : (papeisDisponiveis[0] ?? 'irmao')
  return { ehDono, papeisDisponiveis, papelAtivo }
}

interface DadosCadastro {
  nome: string
  email: string
  senha: string
}

interface SessionState {
  user: Usuario | null
  /** Conta de manutenção do dono do app (acesso total, oculto dos demais). */
  ehDono: boolean
  /** Papéis pelos quais este usuário pode navegar. */
  papeisDisponiveis: Papel[]
  /** Papel pelo qual a interface se comporta. */
  papelAtivo: Papel
  theme: Theme
  period: Period
  locked: boolean
  /** Verdadeiro enquanto o log ainda está sendo lido do disco. */
  carregando: boolean

  iniciar: () => Promise<void>
  cadastrar: (dados: DadosCadastro) => Promise<Resultado>
  login: (email: string, senha: string) => Promise<Resultado>
  logout: () => void
  /** Passa a navegar por outro dos papéis disponíveis (sem alterar o papel real). */
  entrarComoPapel: (papel: Papel) => void
  setTheme: (t: Theme) => void
  setPeriod: (p: Period) => void
  unlock: (pin: string) => boolean
  lock: () => void
}

/** Fundos iniciais — a igreja precisa de pelo menos um lugar para o dinheiro. */
const FUNDOS_INICIAIS = [
  { id: 'f-geral', nome: 'Caixa geral', descricao: 'Dízimos e ofertas do dia a dia', cor: 'var(--chart-1)' },
  { id: 'f-missoes', nome: 'Missões', descricao: 'Ofertas destinadas a missões', cor: 'var(--chart-2)' },
  { id: 'f-obras', nome: 'Obras', descricao: 'Construção e reformas do templo', cor: 'var(--chart-3)' },
]

function guardarUsuarioLocal(id: string) {
  localStorage.setItem(USER_KEY, id)
}

function emailIgual(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** Coloca o usuário no ar: define quem assina, avisa a auditoria e conecta. */
async function entrar(usuario: Usuario, privada: string, publica: string) {
  motor.definirAutor({
    usuarioId: usuario.id,
    privada,
    publica,
    nome: usuario.nome,
    papel: usuario.papel,
  })
  setAuditUser(usuario.nome)
  await guardarChave(usuario.id, privada, publica)
  guardarUsuarioLocal(usuario.id)
  // A malha é única e fixa: todo aparelho do app pertence a esta igreja.
  motor.conectar()
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

  /** Lê o log do disco e restaura a sessão anterior, se houver. */
  iniciar: async () => {
    await motor.iniciar()

    // A malha entra no ar já na abertura, mesmo sem ninguém logado: assim um
    // aparelho novo recebe os cadastros existentes e consegue fazer login sem
    // ter guardado nada antes — os dados vêm dos outros aparelhos.
    motor.conectar()

    const id = localStorage.getItem(USER_KEY)
    const chave = await lerChave()
    const usuario = id ? (db.usuarios.find((u) => u.id === id) ?? null) : null

    if (usuario && chave?.usuarioId === usuario.id) {
      await entrar(usuario, chave.privada, chave.publica)
      set({ user: usuario, ...estadoDePapel(usuario) })
    }

    // Os papéis podem mudar pela rede: o pastor promove alguém e a alteração
    // chega enquanto a pessoa está com o app aberto.
    motor.inscrever(() => {
      const atual = get().user
      if (!atual) return
      const atualizado = db.usuarios.find((u) => u.id === atual.id)
      if (!atualizado) return
      const mudouPapeis =
        JSON.stringify(papeisDoUsuario(atualizado)) !== JSON.stringify(papeisDoUsuario(atual))
      if (mudouPapeis || atualizado.nome !== atual.nome) {
        motor.definirAutor({
          usuarioId: atualizado.id,
          privada: motor.autorAtual()?.privada ?? '',
          publica: motor.autorAtual()?.publica ?? '',
          nome: atualizado.nome,
          papel: atualizado.papel,
        })
        setAuditUser(atualizado.nome)
        // Recalcula os papéis disponíveis mantendo, se possível, o papel em uso.
        const estado = estadoDePapel(atualizado)
        const manterAtivo = estado.papeisDisponiveis.includes(get().papelAtivo)
        set({
          user: atualizado,
          ehDono: estado.ehDono,
          papeisDisponiveis: estado.papeisDisponiveis,
          papelAtivo: manterAtivo ? get().papelAtivo : estado.papelAtivo,
        })
      }
    })

    set({ carregando: false })
  },

  cadastrar: async ({ nome, email, senha }) => {
    if (!temCriptografia()) {
      return { ok: false, erro: 'O cadastro exige uma conexão segura (https).' }
    }
    if (nome.trim().length < 3) return { ok: false, erro: 'Informe o nome completo.' }
    if (senha.length < 6) return { ok: false, erro: 'A senha precisa de ao menos 6 caracteres.' }
    if (db.usuarios.some((u) => emailIgual(u.email, email))) {
      return { ok: false, erro: 'Já existe um cadastro com este e-mail.' }
    }

    // O primeiro cadastro da igreja é o pastor. Todos os seguintes entram como
    // membros — quem decide isso é a projeção do log, não este aparelho.
    const primeiro = db.usuarios.length === 0

    const chaves = await gerarParDeChaves()
    if (!chaves) return { ok: false, erro: 'Este navegador não suporta o cadastro seguro.' }

    const sal = novoSal()
    const hash = await hashSenha(senha, sal)
    const chaveCifrada = await cifrarComSenha(chaves.privada, senha)
    if (!chaveCifrada) return { ok: false, erro: 'Falha ao proteger a chave de acesso.' }

    const usuarioId = `u-${idAleatorio(10)}`
    const membroId = `m-${idAleatorio(10)}`

    const usuario: Usuario = {
      id: usuarioId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      papel: primeiro ? 'pastor' : 'irmao',
      membroId,
      hash,
      sal,
      pub: chaves.publica,
      chaveCifrada,
      criadoEm: new Date().toISOString(),
    }

    const itens: { col: 'usuarios' | 'membros' | 'config' | 'fundos'; key: string; val: unknown }[] =
      [
        { col: 'usuarios', key: usuarioId, val: usuario },
        {
          col: 'membros',
          key: membroId,
          val: { id: membroId, nome: usuario.nome, email: usuario.email, ativo: true },
        },
      ]

    await motor.registrarCadastro(usuarioId, chaves, itens)
    await entrar(usuario, chaves.privada, chaves.publica)

    // O fundador monta a base da igreja: dados e fundos iniciais. A conta do
    // dono nunca funda (é sempre membro), então não dispara essa preparação.
    if (primeiro && !ehEmailDono(usuario.email)) {
      services.saveConfig({
        nome: 'Minha igreja',
        razaoSocial: '',
        pastor: usuario.nome,
        fundacao: String(new Date().getFullYear()),
      })
      for (const f of FUNDOS_INICIAIS) {
        motor.gravar('fundos', f.id, f)
      }
    }

    const projetado = db.usuarios.find((u) => u.id === usuarioId) ?? usuario
    set({ user: projetado, ...estadoDePapel(projetado) })
    return { ok: true }
  },

  login: async (email, senha) => {
    const usuario = db.usuarios.find((u) => emailIgual(u.email, email))
    if (!usuario) return { ok: false, erro: 'E-mail não encontrado neste aparelho.' }
    if (!usuario.sal || !usuario.hash) return { ok: false, erro: 'Cadastro incompleto.' }

    const hash = await hashSenha(senha, usuario.sal)
    if (!comparaSegura(hash, usuario.hash)) return { ok: false, erro: 'Senha incorreta.' }

    // A chave privada vem cifrada no próprio cadastro, então a conta funciona
    // em qualquer aparelho — basta a senha para abri-la.
    const local = await lerChave()
    let privada = local?.usuarioId === usuario.id ? local.privada : null
    if (!privada && usuario.chaveCifrada) {
      privada = await decifrarComSenha(usuario.chaveCifrada, senha)
    }
    if (!privada || !usuario.pub) {
      return { ok: false, erro: 'Não foi possível abrir a chave de acesso deste cadastro.' }
    }

    await entrar(usuario, privada, usuario.pub)
    set({ user: usuario, ...estadoDePapel(usuario) })
    return { ok: true }
  },

  logout: () => {
    // Não apagamos o log: os dados ficam no aparelho e no restante da malha,
    // então basta entrar de novo (com a senha) para recuperar tudo.
    localStorage.removeItem(USER_KEY)
    void limparChave()
    motor.limparAutor()
    motor.desconectar()
    set({ user: null, ehDono: false, papeisDisponiveis: ['irmao'], papelAtivo: 'irmao' })
  },

  entrarComoPapel: (papel) => {
    if (!get().papeisDisponiveis.includes(papel)) return
    localStorage.setItem(PAPEL_DEUS_KEY, papel)
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
