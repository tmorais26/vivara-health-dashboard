-- Atualizações em tempo real (respeitam as políticas RLS).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_mensagens') then
    alter publication supabase_realtime add table public.chat_mensagens;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notificacoes') then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'canal_mensagens') then
    alter publication supabase_realtime add table public.canal_mensagens;
  end if;
end $$;
