-- Notificações, chat médico–utente e edição do perfil do médico.

-- ---------------------------------------------------------------------------
-- Perfil: o próprio médico edita; a validação da cédula é só da Vivara.
-- ---------------------------------------------------------------------------
create or replace function public.guardar_perfil(p_nome text, p_especialidade text, p_cedula text, p_clinica text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  if p_nome is null or length(trim(p_nome)) = 0 then raise exception 'O nome é obrigatório'; end if;
  insert into public.medico_perfis (user_id, nome, especialidade, cedula_profissional, clinica)
  values (auth.uid(), trim(p_nome), nullif(trim(p_especialidade), ''), nullif(trim(p_cedula), ''), nullif(trim(p_clinica), ''))
  on conflict (user_id) do update set
    nome = excluded.nome,
    especialidade = excluded.especialidade,
    clinica = excluded.clinica,
    cedula_validada = case when public.medico_perfis.cedula_profissional is distinct from excluded.cedula_profissional
                           then false else public.medico_perfis.cedula_validada end,
    cedula_profissional = excluded.cedula_profissional;
  update public.membros set nome_exibicao = trim(p_nome) where user_id = auth.uid();
end $$;
revoke execute on function public.guardar_perfil(text, text, text, text) from public, anon;

-- ---------------------------------------------------------------------------
-- Notificações (geradas pela base de dados)
-- ---------------------------------------------------------------------------
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  espaco_id uuid references public.espacos(id) on delete cascade,
  tipo text not null check (tipo in ('consulta', 'analise', 'exame', 'mensagem', 'exportacao_pedido', 'exportacao_decisao', 'membro')),
  utente_id uuid references public.utentes(id) on delete cascade,
  ref_id uuid,
  detalhe jsonb,
  lida boolean not null default false,
  criada_em timestamptz not null default now()
);
create index on public.notificacoes (user_id, criada_em desc);

alter table public.notificacoes enable row level security;
create policy notificacoes_ler on public.notificacoes for select to authenticated using (user_id = (select auth.uid()));
create policy notificacoes_marcar on public.notificacoes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notificacoes_apagar on public.notificacoes for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.notificar_membro(p_membro uuid, p_tipo text, p_utente uuid, p_ref uuid, p_detalhe jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.notificacoes (user_id, espaco_id, tipo, utente_id, ref_id, detalhe)
  select m.user_id, m.espaco_id, p_tipo, p_utente, p_ref, p_detalhe
  from public.membros m where m.id = p_membro and m.estado = 'ativo' and m.user_id is distinct from auth.uid()
$$;
revoke execute on function public.notificar_membro(uuid, text, uuid, uuid, jsonb) from public, anon, authenticated;

-- Consulta marcada por outra pessoa → avisa o profissional.
create or replace function public.tg_notificar_consulta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_membro(new.profissional_id, 'consulta', new.utente_id, new.id,
    jsonb_build_object('inicio', new.inicio));
  return new;
end $$;
create trigger notificar_consulta after insert on public.consultas
  for each row execute function public.tg_notificar_consulta();

-- Pedido de exportação pendente → avisa a administração; decisão → avisa quem pediu.
create or replace function public.tg_notificar_exportacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_admin uuid;
begin
  if tg_op = 'INSERT' and new.estado = 'pendente' then
    for v_admin in select id from public.membros where espaco_id = new.espaco_id and papel_admin is not null and estado = 'ativo' loop
      perform public.notificar_membro(v_admin, 'exportacao_pedido', new.utente_id, new.id, jsonb_build_object('ambito', new.ambito));
    end loop;
  elsif tg_op = 'UPDATE' and old.estado = 'pendente' and new.estado in ('aprovado', 'recusado') then
    perform public.notificar_membro(new.requerente_id, 'exportacao_decisao', new.utente_id, new.id,
      jsonb_build_object('estado', new.estado, 'expira_em', new.expira_em));
  end if;
  return new;
end $$;
create trigger notificar_exportacao after insert or update of estado on public.pedidos_exportacao
  for each row execute function public.tg_notificar_exportacao();

-- Mensagem direta no chat interno → avisa o destinatário.
create or replace function public.tg_notificar_canal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.para_id is not null then
    perform public.notificar_membro(new.para_id, 'mensagem', null, new.id, jsonb_build_object('canal', true));
  end if;
  return new;
end $$;
create trigger notificar_canal after insert on public.canal_mensagens
  for each row execute function public.tg_notificar_canal();

-- ---------------------------------------------------------------------------
-- Chat médico–utente. Só existe se o médico o ativar (utentes.chat_estado).
-- O lado do utente (app) terá as suas próprias políticas quando a app tiver contas.
-- ---------------------------------------------------------------------------
create table public.chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_membro_id uuid references public.membros(id) on delete set null,
  do_utente boolean not null default false,
  texto text not null default '' check (length(texto) <= 4000),
  anexos jsonb not null default '[]'::jsonb,
  criada_em timestamptz not null default now(),
  check (do_utente or autor_membro_id is not null)
);
create index on public.chat_mensagens (utente_id, criada_em);
create trigger chat_mesmo_espaco before insert or update on public.chat_mensagens
  for each row execute function public.tg_mesmo_espaco();

alter table public.chat_mensagens enable row level security;
create policy chat_ler on public.chat_mensagens for select to authenticated using (public.segue_utente(utente_id));
create policy chat_enviar on public.chat_mensagens for insert to authenticated
  with check (
    not do_utente
    and public.segue_utente(utente_id)
    and autor_membro_id = (public.meu_membro(espaco_id)).id
    and exists (select 1 from public.utentes u where u.id = utente_id and u.chat_estado = 'ativo')
  );

-- Eliminar a conversa: apaga as mensagens para os dois (só quem segue o utente).
create or replace function public.eliminar_conversa(p_utente uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_espaco uuid;
begin
  if not public.segue_utente(p_utente) then raise exception 'Sem permissão'; end if;
  select espaco_id into v_espaco from public.utentes where id = p_utente;
  delete from public.chat_mensagens where utente_id = p_utente;
  perform public.auditar(v_espaco, 'eliminar_conversa', p_utente::text, null);
end $$;
revoke execute on function public.eliminar_conversa(uuid) from public, anon;

-- Só quem segue o utente muda o estado do chat.
create or replace function public.definir_chat(p_utente uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v_espaco uuid;
begin
  if not public.segue_utente(p_utente) then raise exception 'Sem permissão'; end if;
  update public.utentes set chat_estado = p_estado where id = p_utente returning espaco_id into v_espaco;
  perform public.auditar(v_espaco, 'definir_chat', p_utente::text, jsonb_build_object('estado', p_estado));
end $$;
revoke execute on function public.definir_chat(uuid, text) from public, anon;

-- O estado do chat só muda através de definir_chat (que corre como dono da função).
create or replace function public.tg_chat_estado_protegido()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Ao criar, só um profissional de saúde pode já ativar o chat.
    if new.chat_estado <> 'desativado' and not exists (
      select 1 from public.membros m where m.id = new.criado_por and m.funcao in ('medico', 'profissional')) then
      new.chat_estado := 'desativado';
    end if;
  elsif new.chat_estado is distinct from old.chat_estado and current_user in ('authenticated', 'anon') then
    raise exception 'Use definir_chat para mudar o estado do chat';
  end if;
  return new;
end $$;
create trigger utentes_chat_estado_protegido before insert or update on public.utentes
  for each row execute function public.tg_chat_estado_protegido();
revoke execute on function public.tg_chat_estado_protegido() from public, anon, authenticated;

revoke execute on function public.tg_notificar_consulta(), public.tg_notificar_exportacao(), public.tg_notificar_canal()
  from public, anon, authenticated;
