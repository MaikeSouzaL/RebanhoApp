// Modelo de domínio — Gestão financeira "O Rebanho de Jesus Cristo".
// Valores monetários em reais (número com 2 casas). Datas em ISO (YYYY-MM-DD).

export type Papel = 'pastor' | 'tesoureiro' | 'irmao'

export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'transferencia'

export type TipoEntrada = 'dizimo' | 'oferta' | 'outra'

export type StatusConta = 'pendente' | 'pago' | 'atrasado'

export type Recorrencia = 'unica' | 'mensal' | 'anual'

export type CategoriaDespesaId =
  | 'aluguel'
  | 'energia'
  | 'agua'
  | 'internet'
  | 'som'
  | 'manutencao'
  | 'materiais'
  | 'prebenda'
  | 'missoes'
  | 'assistencia'
  | 'eventos'
  | 'transporte'
  | 'outros'

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  membroId?: string
  senha: string // mock
}

export interface Membro {
  id: string
  nome: string
  telefone?: string
  email?: string
  ministerio?: string
  batizadoEm?: string
  nascimento?: string // 'YYYY-MM-DD' (aniversário)
  ativo: boolean
}

export interface Fundo {
  id: string
  nome: string
  descricao: string
  cor: string // token css var, ex.: 'var(--chart-1)'
  meta?: number // para campanhas (Missões, Construção)
}

export interface Entrada {
  id: string
  tipo: TipoEntrada
  subtipo?: string // ex.: 'Culto', 'Missões', 'Gratidão', 'Doação'
  valor: number
  data: string
  competencia: string // 'YYYY-MM'
  forma: FormaPagamento
  fundoId: string
  membroId?: string | null // null = anônimo
  obs?: string
}

export interface Saida {
  id: string
  categoria: CategoriaDespesaId
  descricao: string
  fornecedor?: string
  valor: number
  data: string
  competencia: string
  forma: FormaPagamento
  fundoId: string
  comprovante?: boolean
  comprovanteUrl?: string // foto do comprovante (data URL)
  obs?: string
}

export interface ContaPagar {
  id: string
  descricao: string
  categoria: CategoriaDespesaId
  valor: number
  vencimento: string
  status: StatusConta
  recorrencia: Recorrencia
  fundoId: string
  fornecedor?: string
  pagoEm?: string
  saidaId?: string
}

export interface Relatorio {
  id: string
  titulo: string
  tipo: 'mensal' | 'trimestral' | 'custom'
  periodoInicio: string
  periodoFim: string
  geradoEm: string
  geradoPor: string
}

export interface ConfigIgreja {
  nome: string
  razaoSocial: string
  cnpj: string
  fundacao: string
  endereco: string
  cidade: string
  pastor: string
  pastorPresidente: string
  telefone: string
  pixTipo: string
  pixChave: string
  orcamento: Partial<Record<CategoriaDespesaId, number>> // orçamento mensal por categoria
}

export type AcaoAudit = 'criou' | 'editou' | 'excluiu' | 'pagou' | 'gerou' | 'importou'

export interface AuditEntry {
  id: string
  ts: string // ISO datetime
  usuario: string
  acao: AcaoAudit
  entidade: string // ex.: 'dízimo', 'despesa', 'conta'
  descricao: string
  valor?: number
}

export interface Database {
  config: ConfigIgreja
  usuarios: Usuario[]
  membros: Membro[]
  fundos: Fundo[]
  entradas: Entrada[]
  saidas: Saida[]
  contasPagar: ContaPagar[]
  relatorios: Relatorio[]
  auditoria: AuditEntry[]
}

// Metadados das categorias de despesa (rótulo + ícone lucide + cor).
export interface CategoriaDespesaMeta {
  id: CategoriaDespesaId
  label: string
  icon: string // nome do ícone lucide
  cor: string
}
