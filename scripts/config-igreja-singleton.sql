-- Linha única (singleton) da configuração da igreja.
--
-- Já aplicada em produção pela migração `config_igreja_singleton`. Mantida aqui
-- para histórico e para recriar o ambiente do zero.
--
-- Problema que resolve: config_igreja usa o padrão singleton (id boolean, sempre
-- true). Se a linha não existir, o saveConfig do app (UPDATE ... WHERE id=true)
-- acerta 0 linhas e não grava nada — o pastor "salva" a chave Pix e os dados da
-- igreja, mas nada persiste, sem erro visível; e a tela Contribuir fica presa em
-- "Pix não configurado".
--
-- Correção em duas frentes: garantir a linha e permitir que o pastor a crie
-- (o app passou a fazer upsert, resiliente a resets futuros).

insert into public.config_igreja (id) values (true) on conflict (id) do nothing;

drop policy if exists config_pastor_insert on public.config_igreja;
create policy config_pastor_insert on public.config_igreja
  for insert to authenticated
  with check (public.eh_pastor());
