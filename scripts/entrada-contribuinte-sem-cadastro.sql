-- Permite identificar quem entregou um dízimo sem criar uma ficha incompleta
-- em membros. Quando há membro_id, o nome sempre vem do cadastro oficial.

alter table public.entradas
  add column if not exists contribuinte_nome text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'entradas_contribuinte_nome_valido'
      and conrelid = 'public.entradas'::regclass
  ) then
    alter table public.entradas
      add constraint entradas_contribuinte_nome_valido check (
        contribuinte_nome is null
        or (
          membro_id is null
          and char_length(btrim(contribuinte_nome)) between 2 and 120
        )
      );
  end if;
end
$$;

comment on column public.entradas.contribuinte_nome is
  'Nome informado pela tesouraria quando o contribuinte ainda não possui cadastro de membro.';
