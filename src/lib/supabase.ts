import { createClient } from '@supabase/supabase-js'

/**
 * Cliente do Supabase — o banco da igreja.
 *
 * A chave abaixo é a *publishable* (antiga "anon"): ela nasceu para ficar no
 * app do usuário e não dá poder nenhum sozinha. Quem decide o que cada pessoa
 * lê e escreve é o Row Level Security no banco, com base em quem está logado.
 * Por isso ela pode ficar no repositório — e assim o deploy funciona sem
 * ninguém precisar configurar variável de ambiente.
 *
 * As variáveis de ambiente continuam valendo, para apontar o app a outro
 * projeto (um de testes, por exemplo) sem mexer no código.
 */
const URL_PADRAO = 'https://hmviisxdutcplymhubiv.supabase.co'
const CHAVE_PADRAO = 'sb_publishable_C6vvusymzAAK6-m80P93lQ_-LJNvFkb'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? URL_PADRAO
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? CHAVE_PADRAO

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Mantém a pessoa logada entre aberturas do app e renova o token sozinho.
    persistSession: true,
    autoRefreshToken: true,
    // Ligado para o "Entrar com Google": ao voltar do Google, o token vem na
    // URL e o Supabase o transforma em sessão automaticamente.
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
