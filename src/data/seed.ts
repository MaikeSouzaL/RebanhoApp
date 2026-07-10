import type {
  ContaPagar,
  Database,
  Entrada,
  Fundo,
  FormaPagamento,
  Membro,
  Saida,
  CategoriaDespesaId,
} from './types'

// ---- RNG determinístico (mulberry32) para dados estáveis na 1ª geração ----
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(19901990)
const rand = (min: number, max: number) => min + rng() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)]!
const chance = (p: number) => rng() < p

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`
}
function monthKey(y: number, m: number) {
  return `${y}-${pad(m)}`
}

const NOMES = [
  'João Batista Ferreira',
  'Maria das Graças Souza',
  'Pedro Henrique Lima',
  'Ana Cláudia Rocha',
  'José Carlos Oliveira',
  'Rute Almeida Santos',
  'Marcos Vinícius Costa',
  'Priscila Gomes Dias',
  'Antônio Sérgio Nunes',
  'Débora Cristina Melo',
  'Paulo Roberto Alves',
  'Sara Fernandes Pinto',
  'Lucas Gabriel Martins',
  'Raquel Barbosa Reis',
  'Tiago Moreira Cunha',
  'Ester Ribeiro Campos',
  'Elias Cardoso Teixeira',
  'Noemi Andrade Freitas',
  'Davi Correia Ramos',
  'Lídia Nogueira Pires',
  'Samuel Azevedo Braga',
  'Mirian Castro Lopes',
  'Isaías Duarte Fonseca',
  'Joana Vieira Macedo',
  'Gideão Peixoto Sales',
  'Salomé Tavares Moura',
  'Estêvão Barros Farias',
  'Dorcas Siqueira Mendes',
]

const MINISTERIOS = [
  'Louvor',
  'Intercessão',
  'Diaconato',
  'Escola Bíblica',
  'Jovens',
  'Missões',
  'Recepção',
  '—',
]

const formaPeso: FormaPagamento[] = [
  'pix', 'pix', 'pix', 'pix',
  'dinheiro', 'dinheiro', 'dinheiro',
  'cartao',
  'transferencia',
]

function money(min: number, max: number, step = 5) {
  return Math.round(rand(min, max) / step) * step
}

export function createDatabase(): Database {
  const now = new Date()
  const nowY = now.getFullYear()
  const nowM = now.getMonth() + 1
  const nowD = now.getDate()

  const fundos: Fundo[] = [
    { id: 'f-geral', nome: 'Geral', descricao: 'Manutenção e operação da igreja', cor: 'var(--chart-1)' },
    { id: 'f-missoes', nome: 'Missões', descricao: 'Envio e sustento missionário', cor: 'var(--chart-2)', meta: 30000 },
    { id: 'f-construcao', nome: 'Construção', descricao: 'Ampliação do templo', cor: 'var(--chart-3)', meta: 120000 },
    { id: 'f-assistencia', nome: 'Assistência', descricao: 'Cestas e apoio social', cor: 'var(--chart-5)' },
  ]

  const membros: Membro[] = NOMES.map((nome, i) => ({
    id: `m-${i + 1}`,
    nome,
    telefone: `(69) 9${randInt(8000, 9999)}-${randInt(1000, 9999)}`,
    ministerio: pick(MINISTERIOS),
    batizadoEm: iso(randInt(2005, 2023), randInt(1, 12), randInt(1, 28)),
    // alguns aniversariantes no mês corrente para a tela de aniversários
    nascimento: iso(randInt(1955, 2005), i < 6 ? nowM : randInt(1, 12), randInt(1, 28)),
    ativo: chance(0.92),
  }))
  const ativos = membros.filter((m) => m.ativo)

  const entradas: Entrada[] = []
  const saidas: Saida[] = []
  let eSeq = 1
  let sSeq = 1

  // Últimos 8 meses (inclui o mês corrente, parcial até hoje).
  const meses: { y: number; m: number }[] = []
  for (let back = 7; back >= 0; back--) {
    const d = new Date(nowY, nowM - 1 - back, 1)
    meses.push({ y: d.getFullYear(), m: d.getMonth() + 1 })
  }

  const maxDay = (y: number, m: number) => (y === nowY && m === nowM ? nowD : new Date(y, m, 0).getDate())

  for (const { y, m } of meses) {
    const comp = monthKey(y, m)
    const limite = maxDay(y, m)
    // crescimento leve mês a mês
    const fator = 0.9 + rng() * 0.35

    // --- DÍZIMOS: 60-75% dos membros ativos dizimam no mês ---
    const dizimistas = ativos.filter(() => chance(0.68))
    for (const membro of dizimistas) {
      const dia = randInt(1, limite)
      const valor = money(
        60,
        pick([120, 150, 200, 250, 300, 400, 500, 650, 800]),
        10,
      )
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'dizimo',
        valor: Math.round(valor * fator),
        data: iso(y, m, dia),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId: 'f-geral',
        membroId: membro.id,
      })
    }

    // --- OFERTAS de culto (quarta + domingos), geralmente anônimas ---
    const cultosDias = [2, 5, 9, 12, 16, 19, 23, 26, 30].filter((d) => d <= limite)
    for (const dia of cultosDias) {
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'oferta',
        subtipo: 'Culto',
        valor: Math.round(money(180, 620, 10) * fator),
        data: iso(y, m, dia),
        competencia: comp,
        forma: pick(['dinheiro', 'dinheiro', 'pix']),
        fundoId: 'f-geral',
        membroId: null,
      })
    }

    // --- OFERTA de missões (mensal) ---
    if (chance(0.85)) {
      const dia = randInt(1, limite)
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'oferta',
        subtipo: 'Missões',
        valor: money(400, 1400, 50),
        data: iso(y, m, dia),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId: 'f-missoes',
        membroId: chance(0.5) ? pick(ativos).id : null,
      })
    }

    // --- OFERTA de construção (campanha) ---
    if (chance(0.7)) {
      const dia = randInt(1, limite)
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'oferta',
        subtipo: 'Construção',
        valor: money(500, 2500, 50),
        data: iso(y, m, dia),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId: 'f-construcao',
        membroId: chance(0.4) ? pick(ativos).id : null,
      })
    }

    // --- OFERTA de gratidão / primícias (esporádica) ---
    if (chance(0.55) && limite > 5) {
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'oferta',
        subtipo: pick(['Gratidão', 'Primícias', 'Ação de graças']),
        valor: money(100, 600, 10),
        data: iso(y, m, randInt(1, limite)),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId: 'f-geral',
        membroId: pick(ativos).id,
      })
    }

    // --- OUTRAS entradas (doação, bazar) ---
    if (chance(0.5)) {
      entradas.push({
        id: `e-${eSeq++}`,
        tipo: 'outra',
        subtipo: pick(['Doação', 'Bazar beneficente', 'Cantina', 'Venda de livros']),
        valor: money(120, 900, 10),
        data: iso(y, m, randInt(1, limite)),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId: chance(0.5) ? 'f-assistencia' : 'f-geral',
        membroId: null,
      })
    }

    // ---------------- SAÍDAS ----------------
    const addSaida = (
      categoria: CategoriaDespesaId,
      descricao: string,
      valor: number,
      dia: number,
      fundoId = 'f-geral',
      fornecedor?: string,
    ) => {
      if (dia > limite) return
      saidas.push({
        id: `s-${sSeq++}`,
        categoria,
        descricao,
        fornecedor,
        valor,
        data: iso(y, m, dia),
        competencia: comp,
        forma: pick(formaPeso),
        fundoId,
        comprovante: chance(0.8),
      })
    }

    addSaida('aluguel', 'Aluguel do templo', 2500, 5, 'f-geral', 'Imobiliária Central')
    addSaida('energia', 'Conta de energia', money(430, 780, 10), 10, 'f-geral', 'Energisa')
    addSaida('agua', 'Conta de água', money(110, 210, 10), 12, 'f-geral', 'CAERD')
    addSaida('internet', 'Internet e telefone', 159, 8, 'f-geral', 'Fibra Net')
    addSaida('prebenda', 'Prebenda pastoral', 3000, 6, 'f-geral')
    if (chance(0.8)) addSaida('som', 'Manutenção de som/mídia', money(120, 620, 10), randInt(6, 24), 'f-geral', 'Áudio Pro')
    if (chance(0.85)) addSaida('materiais', 'Materiais e limpeza', money(120, 480, 10), randInt(3, 26), 'f-geral', 'Atacadão')
    if (chance(0.7)) addSaida('assistencia', 'Cestas básicas', money(250, 1100, 50), randInt(5, 26), 'f-assistencia', 'Supermercado Bom Preço')
    if (chance(0.7)) addSaida('missoes', 'Repasse missionário', money(400, 1300, 50), randInt(8, 26), 'f-missoes')
    if (chance(0.35)) addSaida('manutencao', 'Reparos e manutenção', money(150, 900, 10), randInt(6, 26), 'f-geral', 'João Reparos')
    if (chance(0.25)) addSaida('eventos', 'Congresso / evento', money(400, 1800, 50), randInt(6, 24), 'f-geral')
    if (chance(0.3)) addSaida('transporte', 'Combustível e transporte', money(120, 500, 10), randInt(4, 26), 'f-geral', 'Posto Ipiranga')
  }

  // ---------------- CONTAS A PAGAR ----------------
  const nowIso = (deltaDays: number) => {
    const d = new Date(nowY, nowM - 1, nowD + deltaDays)
    return iso(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }
  let cSeq = 1
  const contasPagar: ContaPagar[] = [
    // vencidas (atrasadas)
    { id: `c-${cSeq++}`, descricao: 'Manutenção do ar-condicionado', categoria: 'manutencao', valor: 480, vencimento: nowIso(-6), status: 'atrasado', recorrencia: 'unica', fundoId: 'f-geral', fornecedor: 'Frio Sul Refrigeração' },
    { id: `c-${cSeq++}`, descricao: 'Conta de água (mês anterior)', categoria: 'agua', valor: 176, vencimento: nowIso(-3), status: 'atrasado', recorrencia: 'mensal', fundoId: 'f-geral', fornecedor: 'CAERD' },
    // vencendo em breve
    { id: `c-${cSeq++}`, descricao: 'Aluguel do templo', categoria: 'aluguel', valor: 2500, vencimento: nowIso(2), status: 'pendente', recorrencia: 'mensal', fundoId: 'f-geral', fornecedor: 'Imobiliária Central' },
    { id: `c-${cSeq++}`, descricao: 'Energia elétrica', categoria: 'energia', valor: 712, vencimento: nowIso(4), status: 'pendente', recorrencia: 'mensal', fundoId: 'f-geral', fornecedor: 'Energisa' },
    { id: `c-${cSeq++}`, descricao: 'Internet e telefone', categoria: 'internet', valor: 159, vencimento: nowIso(6), status: 'pendente', recorrencia: 'mensal', fundoId: 'f-geral', fornecedor: 'Fibra Net' },
    { id: `c-${cSeq++}`, descricao: 'Prebenda pastoral', categoria: 'prebenda', valor: 3000, vencimento: nowIso(9), status: 'pendente', recorrencia: 'mensal', fundoId: 'f-geral' },
    // futuras
    { id: `c-${cSeq++}`, descricao: 'Sonorização — parcela 2/3', categoria: 'som', valor: 620, vencimento: nowIso(18), status: 'pendente', recorrencia: 'unica', fundoId: 'f-geral', fornecedor: 'Áudio Pro' },
    { id: `c-${cSeq++}`, descricao: 'Cestas básicas — assistência', categoria: 'assistencia', valor: 850, vencimento: nowIso(21), status: 'pendente', recorrencia: 'mensal', fundoId: 'f-assistencia', fornecedor: 'Supermercado Bom Preço' },
    // já pagas neste mês
    { id: `c-${cSeq++}`, descricao: 'Materiais de limpeza', categoria: 'materiais', valor: 240, vencimento: nowIso(-10), status: 'pago', recorrencia: 'mensal', fundoId: 'f-geral', fornecedor: 'Atacadão', pagoEm: nowIso(-11) },
    { id: `c-${cSeq++}`, descricao: 'Repasse missionário', categoria: 'missoes', valor: 900, vencimento: nowIso(-8), status: 'pago', recorrencia: 'mensal', fundoId: 'f-missoes', pagoEm: nowIso(-8) },
  ]

  const usuarios = [
    { id: 'u-pastor', nome: 'Pr. Josué Andrade', email: 'pastor@rebanho.app', papel: 'pastor' as const, senha: 'rebanho123' },
    { id: 'u-tesoureiro', nome: 'Irmã Priscila Gomes', email: 'tesouraria@rebanho.app', papel: 'tesoureiro' as const, senha: 'rebanho123', membroId: 'm-8' },
    { id: 'u-irmao', nome: 'João Batista Ferreira', email: 'joao@rebanho.app', papel: 'irmao' as const, senha: 'rebanho123', membroId: 'm-1' },
  ]

  const config = {
    nome: 'O Rebanho de Jesus Cristo',
    razaoSocial: 'Igreja Pentecostal O Rebanho de Jesus Cristo',
    cnpj: '12.345.678/0001-90',
    fundacao: '1990',
    endereco: 'Rua da Paz, 120 — Centro',
    cidade: 'Ji-Paraná / RO',
    pastor: 'Pr. Josué Andrade',
    pastorPresidente: 'Pr. Presidente Abraão Lima',
    telefone: '(69) 3421-0000',
    pixTipo: 'CNPJ',
    pixChave: '12.345.678/0001-90',
    orcamento: {
      aluguel: 2500,
      energia: 700,
      agua: 200,
      internet: 160,
      prebenda: 3000,
      som: 500,
      materiais: 400,
      assistencia: 1000,
      missoes: 1200,
      manutencao: 600,
    },
  }

  const relatorios = [
    {
      id: 'r-1',
      titulo: `Prestação de contas — ${monthKey(meses[6]!.y, meses[6]!.m)}`,
      tipo: 'mensal' as const,
      periodoInicio: iso(meses[6]!.y, meses[6]!.m, 1),
      periodoFim: iso(meses[6]!.y, meses[6]!.m, new Date(meses[6]!.y, meses[6]!.m, 0).getDate()),
      geradoEm: iso(meses[7]!.y, meses[7]!.m, 3),
      geradoPor: 'Pr. Josué Andrade',
    },
  ]

  return {
    config,
    usuarios,
    membros,
    fundos,
    entradas,
    saidas,
    contasPagar,
    relatorios,
    auditoria: [],
  }
}
