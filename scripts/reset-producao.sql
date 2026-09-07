-- ============================================================
--  Rebanho Finance — RESET PARA PRODUÇÃO
-- ============================================================
--  Apaga TODOS os dados (usuários, lançamentos, membros, histórico) e deixa
--  o banco pronto para o primeiro cadastro virar o pastor.
--
--  Como usar:
--    Supabase → projeto "rebanho-finance" → SQL Editor → cole tudo → Run.
--
--  É seguro rodar mais de uma vez. Roda dentro de uma transação: se algo
--  falhar, nada é apagado. NÃO mexe no schema (tabelas, funções, gatilhos),
--  só nos dados.
--
--  ⚠️  Não dá para desfazer. Use apenas quando quiser começar do zero.
-- ============================================================

begin;

-- O gatilho que impede a igreja de ficar sem pastor bloquearia apagar o
-- último pastor. Desligamos só durante a limpeza e religamos ao final.
alter table public.user_roles disable trigger trg_protege_ultimo_pastor;

-- 1) Dados financeiros e histórico
delete from public.entradas;
delete from public.saidas;
delete from public.contas_pagar;
delete from public.relatorios;
delete from public.auditoria;

-- 2) Contas de acesso (apaga em cascata os perfis e os papéis)
delete from auth.users;

-- 3) Rol de membros
delete from public.membros;

-- Religa a proteção do último pastor
alter table public.user_roles enable trigger trg_protege_ultimo_pastor;

-- 4) Dados da igreja: volta aos valores em branco (o pastor preenche depois).
--    A chave Pix é zerada para não ficar nenhuma de teste.
update public.config_igreja set
  nome = 'O Rebanho de Jesus Cristo',
  razao_social = '',
  cnpj = '',
  fundacao = '',
  endereco = '',
  cidade = '',
  pastor = '',
  pastor_presidente = '',
  telefone = '',
  pix_tipo = 'CNPJ',
  pix_chave = '',
  orcamento = '{}'::jsonb
where id;

-- 5) Fundos de fábrica: garante que os três existam (não duplica).
insert into public.fundos (id, nome, descricao, cor) values
  ('f-geral',   'Caixa geral', 'Dízimos e ofertas do dia a dia',  'var(--chart-1)'),
  ('f-missoes', 'Missões',     'Ofertas destinadas a missões',    'var(--chart-2)'),
  ('f-obras',   'Obras',       'Construção e reformas do templo',  'var(--chart-3)')
on conflict (id) do nothing;

commit;

-- Conferência: deve mostrar 0 usuários, 0 entradas, 3 fundos e tem_pastor = false
select
  (select count(*) from auth.users)        as usuarios,
  (select count(*) from public.entradas)   as entradas,
  (select count(*) from public.membros)    as membros,
  (select count(*) from public.fundos)     as fundos,
  public.existe_pastor()                   as tem_pastor;
