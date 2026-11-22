-- Notificações úteis também para quem trabalha sozinho (Plano Médico), e preferências reais.
--
-- Novos tipos:
--   agenda_hoje          resumo das consultas do dia (de manhã)
--   consulta_por_fechar  consulta que já passou e continua "agendada"
--   exame_atrasado       exame pedido sem resultado depois do prazo (ou 30 dias)
--   medicacao_fim        medicação ativa que termina em 3 dias ou já passou a data de fim
--   partilha             um colega partilhou consigo um diário ou uma observação
-- Novos eventos para tipos que já existiam:
--   mensagem   mensagem do utente no chat → profissionais que o seguem
--   analise    análises/exame registados por um colega → restantes profissionais que seguem o utente
--   membro     foi adicionado a uma clínica

alter table public.notificacoes drop constraint if exists notificacoes_tipo_check;
alter table public.notificacoes add constraint notificacoes_tipo_check check (tipo in (
  'consulta', 'analise', 'exame', 'mensagem', 'exportacao_pedido', 'exportacao_decisao', 'membro',
  'agenda_hoje', 'consulta_por_fechar', 'exame_atrasado', 'medicacao_fim', 'partilha'));

-- Preferências: tipos que a pessoa desligou.
create table if not exists public.preferencias_notificacao (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desligadas text[] not null default '{}',
  atualizado_em timestamptz not null default now()
);
alter table public.preferencias_notificacao enable row level security;
create policy preferencias_ler on public.preferencias_notificacao for select to authenticated
  using (user_id = (select auth.uid()));
create policy preferencias_criar on public.preferencias_notificacao for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy preferencias_alterar on public.preferencias_notificacao for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notifica um membro, salvo se for quem fez a ação ou se desligou este tipo.
create or replace function public.notificar_membro(p_membro uuid, p_tipo text, p_utente uuid, p_ref uuid, p_detalhe jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.notificacoes (user_id, espaco_id, tipo, utente_id, ref_id, detalhe)
  select m.user_id, m.espaco_id, p_tipo, p_utente, p_ref, p_detalhe
  from public.membros m
  where m.id = p_membro and m.estado = 'ativo' and m.user_id is distinct from auth.uid()
    and not exists (select 1 from public.preferencias_notificacao p
                    where p.user_id = m.user_id and p_tipo = any (p.desligadas))
$$;
revoke execute on function public.notificar_membro(uuid, text, uuid, uuid, jsonb) from public, anon, authenticated;

-- Mensagem do utente no chat → profissionais clínicos que o seguem.
create or replace function public.tg_notificar_chat_utente()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_membro uuid;
begin
  if new.do_utente then
    for v_membro in
      select s.membro_id from public.seguimentos s join public.membros m on m.id = s.membro_id
      where s.utente_id = new.utente_id and m.estado = 'ativo' and m.funcao in ('medico', 'profissional')
    loop
      perform public.notificar_membro(v_membro, 'mensagem', new.utente_id, new.id, jsonb_build_object('chat', true));
    end loop;
  end if;
  return new;
end $$;
create trigger notificar_chat_utente after insert on public.chat_mensagens
  for each row execute function public.tg_notificar_chat_utente();

-- Diário ou observação partilhados consigo.
create or replace function public.tg_notificar_partilha()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_utente uuid; v_ref uuid; v_tipo text;
begin
  if tg_table_name = 'diario_partilhas' then
    select d.utente_id, d.id into v_utente, v_ref from public.diarios d where d.id = new.diario_id;
    v_tipo := 'diario';
  else
    select o.utente_id, o.id into v_utente, v_ref from public.observacoes o where o.id = new.observacao_id;
    v_tipo := 'observacao';
  end if;
  perform public.notificar_membro(new.membro_id, 'partilha', v_utente, v_ref, jsonb_build_object('registo', v_tipo));
  return new;
end $$;
create trigger notificar_partilha_diario after insert on public.diario_partilhas
  for each row execute function public.tg_notificar_partilha();
create trigger notificar_partilha_observacao after insert on public.observacao_partilhas
  for each row execute function public.tg_notificar_partilha();

-- Adicionado a uma clínica.
create or replace function public.tg_notificar_membro_novo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_membro(new.id, 'membro', null, new.espaco_id,
    jsonb_build_object('espaco', (select e.nome from public.espacos e where e.id = new.espaco_id)));
  return new;
end $$;
create trigger notificar_membro_novo after insert on public.membros
  for each row execute function public.tg_notificar_membro_novo();

-- Análises ou exame registados → os outros profissionais que seguem o utente.
create or replace function public.tg_notificar_analise()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_membro uuid;
begin
  for v_membro in
    select s.membro_id from public.seguimentos s join public.membros m on m.id = s.membro_id
    where s.utente_id = new.utente_id and s.membro_id <> new.autor_id
      and m.estado = 'ativo' and m.funcao in ('medico', 'profissional')
  loop
    perform public.notificar_membro(v_membro, case when new.tipo = 'analises' then 'analise' else 'exame' end,
      new.utente_id, new.id, jsonb_build_object('data', new.data_colheita, 'titulo', new.titulo));
  end loop;
  return new;
end $$;
create trigger notificar_analise after insert on public.analises
  for each row execute function public.tg_notificar_analise();

revoke execute on function public.tg_notificar_chat_utente(), public.tg_notificar_partilha(),
  public.tg_notificar_membro_novo(), public.tg_notificar_analise() from public, anon, authenticated;

-- Verificação diária (de manhã, hora de Lisboa). Cada aviso é criado uma só vez.
create or replace function public.gerar_notificacoes_diarias()
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje date := (now() at time zone 'Europe/Lisbon')::date;
  r record;
begin
  -- Agenda de hoje: uma notificação por profissional com consultas.
  for r in
    select c.profissional_id, c.espaco_id, count(*) as n, min(c.inicio) as primeira
    from public.consultas c
    where c.estado = 'agendada' and (c.inicio at time zone 'Europe/Lisbon')::date = hoje
    group by c.profissional_id, c.espaco_id
  loop
    if not exists (select 1 from public.notificacoes n join public.membros m on m.user_id = n.user_id
                   where m.id = r.profissional_id and n.tipo = 'agenda_hoje' and n.espaco_id = r.espaco_id
                     and n.detalhe->>'dia' = hoje::text) then
      perform public.notificar_membro(r.profissional_id, 'agenda_hoje', null, null,
        jsonb_build_object('dia', hoje, 'n', r.n, 'primeira', r.primeira));
    end if;
  end loop;

  -- Consultas que já passaram (há mais de 12 horas) e continuam por fechar.
  for r in
    select c.id, c.profissional_id, c.utente_id, c.inicio from public.consultas c
    where c.estado = 'agendada' and c.inicio + make_interval(mins => c.duracao_min) < now() - interval '12 hours'
      and not exists (select 1 from public.notificacoes n where n.tipo = 'consulta_por_fechar' and n.ref_id = c.id)
  loop
    perform public.notificar_membro(r.profissional_id, 'consulta_por_fechar', r.utente_id, r.id,
      jsonb_build_object('inicio', r.inicio));
  end loop;

  -- Exames pedidos sem resultado depois do prazo (ou de 30 dias, sem prazo).
  for r in
    select p.id, p.autor_id, p.utente_id, p.descricao, p.pedido_em from public.pedidos_exame p
    where p.estado = 'pendente'
      and (p.prazo < hoje or (p.prazo is null and p.pedido_em < hoje - 30))
      and not exists (select 1 from public.notificacoes n where n.tipo = 'exame_atrasado' and n.ref_id = p.id)
  loop
    perform public.notificar_membro(r.autor_id, 'exame_atrasado', r.utente_id, r.id,
      jsonb_build_object('descricao', r.descricao, 'pedido_em', r.pedido_em));
  end loop;

  -- Medicação ativa que termina nos próximos 3 dias ou já passou a data de fim.
  for r in
    select md.id, md.autor_id, md.utente_id, md.dci, md.fim from public.medicacoes md
    where md.estado = 'ativa' and not md.cronica and md.fim is not null and md.fim <= hoje + 3
      and not exists (select 1 from public.notificacoes n where n.tipo = 'medicacao_fim' and n.ref_id = md.id)
  loop
    perform public.notificar_membro(r.autor_id, 'medicacao_fim', r.utente_id, r.id,
      jsonb_build_object('dci', r.dci, 'fim', r.fim));
  end loop;
end $$;
revoke execute on function public.gerar_notificacoes_diarias() from public, anon, authenticated;

-- 07:00 UTC = 7h (inverno) / 8h (verão) em Lisboa.
select cron.unschedule('vivara-notificacoes-diarias')
where exists (select 1 from cron.job where jobname = 'vivara-notificacoes-diarias');
select cron.schedule('vivara-notificacoes-diarias', '0 7 * * *', 'select public.gerar_notificacoes_diarias()');
