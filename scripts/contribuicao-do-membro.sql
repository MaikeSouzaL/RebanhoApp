-- Contribuição do próprio membro (Dízimo/Oferta via Pix).
--
-- Já aplicada em produção pela migração `contribuicao_do_membro`. Fica aqui
-- para histórico e para recriar o ambiente do zero, se necessário.
--
-- O que faz:
--   1. Marca a ORIGEM de cada entrada — 'tesouraria' (lançada por pastor/
--      tesoureiro) ou 'membro' (auto-registrada pelo contribuinte na tela
--      Contribuir). O default mantém todo o histórico atual como 'tesouraria'.
--   2. Abre uma política RLS estreita: o membro pode registrar A PRÓPRIA
--      contribuição — só para si, só dízimo/oferta, só via Pix, valor > 0 e
--      sempre marcada como 'membro'. A tesouraria/pastor seguem com acesso
--      amplo pela política `entradas_gestao`.

alter table public.entradas
  add column if not exists origem text not null default 'tesouraria';

drop policy if exists entradas_autocontribuicao on public.entradas;
create policy entradas_autocontribuicao on public.entradas
  for insert to authenticated
  with check (
    origem = 'membro'
    and membro_id is not null
    and membro_id = public.meu_membro_id()
    and tipo::text in ('dizimo', 'oferta')
    and forma::text = 'pix'
    and valor > 0
  );
