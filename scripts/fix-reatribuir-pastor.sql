-- ============================================================
--  Rebanho Finance — permitir que o DONO reatribua o pastor
-- ============================================================
--  Problema: o primeiro cadastro vira o pastor fundador. Se você quiser
--  transformá-lo em tesoureiro, o gatilho que protege o "último pastor"
--  bloqueia — mesmo para você, dono, que é o administrador-raiz.
--
--  Este script ajusta o gatilho: a conta do dono (eh_dono) passa a poder
--  remover o papel de pastor de qualquer pessoa, inclusive do único pastor.
--  Para todos os outros, a proteção continua igual (a igreja nunca fica sem
--  pastor por engano de um pastor comum).
--
--  Como usar:
--    Supabase → projeto "rebanho-finance" → SQL Editor → cole tudo → Run.
--  Seguro rodar mais de uma vez. Só substitui a função do gatilho.
-- ============================================================

create or replace function public.protege_ultimo_pastor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- O dono é o administrador-raiz: pode reorganizar os papéis à vontade,
  -- pois sempre consegue voltar e nomear um novo pastor.
  if public.eh_dono() then
    return old;
  end if;

  -- Para os demais: não deixa remover o papel do último pastor da igreja.
  if old.papel = 'pastor'
     and not exists (
       select 1 from public.user_roles
       where papel = 'pastor' and user_id <> old.user_id
     )
  then
    raise exception 'A igreja precisa de ao menos um pastor.';
  end if;

  return old;
end;
$$;

-- Pronto. Agora, logado como maikesouzaleite@gmail.com, abra Usuários,
-- toque na pessoa, desmarque "Pastor", marque "Tesoureiro" e salve.
