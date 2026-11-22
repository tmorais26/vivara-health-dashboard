-- Chat médico–utente do lado da app do utente.
--
-- A conta do utente (app) fica ligada à ficha do utente (portal) quando aceita o convite do médico.
-- Regras para o utente:
--   chat 'ativo'      → vê e escreve
--   chat 'bloqueado'  → vê, mas não escreve
--   chat 'desativado' → não vê (o médico ainda não começou ou desligou)
-- Só o médico começa o chat (definir_chat); o utente nunca o consegue ligar.

create table public.utente_contas (
  utente_id uuid primary key references public.utentes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  origem text not null default 'convite' check (origem in ('convite')),
  ligado_em timestamptz not null default now()
);
create index on public.utente_contas (user_id);
alter table public.utente_contas enable row level security;

-- O próprio utente vê as suas ligações; quem segue o utente vê se ele tem a app ligada.
create policy utente_contas_ler on public.utente_contas for select to authenticated
  using (user_id = (select auth.uid()) or public.segue_utente(utente_id));

-- Convites já aceites antes desta migração.
insert into public.utente_contas (utente_id, user_id, ligado_em)
select distinct on (c.utente_id) c.utente_id, c.usado_por, c.usado_em
from public.convites_app c
where c.utente_id is not null and c.usado_por is not null
order by c.utente_id, c.usado_em desc
on conflict (utente_id) do nothing;

create or replace function public.e_conta_do_utente(p_utente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.utente_contas uc where uc.utente_id = p_utente and uc.user_id = auth.uid())
$$;
revoke execute on function public.e_conta_do_utente(uuid) from public, anon;

-- Estado do chat visto pelo utente (null se a conta não estiver ligada a esta ficha).
-- Função própria porque o utente não pode ler a tabela de utentes do portal.
create or replace function public.estado_chat_app(p_utente uuid)
returns text language sql stable security definer set search_path = public as $$
  select u.chat_estado from public.utentes u
  where u.id = p_utente and public.e_conta_do_utente(p_utente)
$$;
revoke execute on function public.estado_chat_app(uuid) from public, anon;

create or replace function public.espaco_do_utente_app(p_utente uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select u.espaco_id from public.utentes u
  where u.id = p_utente and public.e_conta_do_utente(p_utente)
$$;
revoke execute on function public.espaco_do_utente_app(uuid) from public, anon;

-- Aceitar o convite: liga sempre a conta à ficha (mesmo que a conta seja antiga ou já tenha usado
-- um código). A recomendação (mês grátis) só conta quando as regras do programa o permitem.
create or replace function public.aceitar_convite_app(p_token uuid)
returns text language plpgsql security definer set search_path = public, auth as $$
declare c public.convites_app; v_criado timestamptz;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  select * into c from public.convites_app where token = p_token for update;
  if c.token is null or c.usado_em is not null then return 'convite_invalido'; end if;
  if c.convidante_id = auth.uid() then return 'proprio_codigo'; end if;
  if public.tipo_conta(auth.uid()) <> 'utente' then return 'nao_aplicavel'; end if;

  update public.convites_app set usado_em = now(), usado_por = auth.uid() where token = p_token;
  if c.utente_id is not null then
    insert into public.utente_contas (utente_id, user_id) values (c.utente_id, auth.uid())
    on conflict (utente_id) do update set user_id = excluded.user_id, ligado_em = now();
  end if;

  select created_at into v_criado from auth.users where id = auth.uid();
  if v_criado >= now() - interval '7 days'
     and not exists (select 1 from public.recomendacoes where convidado_id = auth.uid()) then
    insert into public.recomendacoes (convidante_id, convidante_tipo, convidado_id, convidado_tipo, origem)
    values (c.convidante_id, 'profissional', auth.uid(), 'utente', 'convite_portal');
  end if;
  return 'ok';
end $$;
revoke execute on function public.aceitar_convite_app(uuid) from public, anon;

-- Leitura e escrita diretas (também servem para o tempo real da app).
create policy chat_utente_ler on public.chat_mensagens for select to authenticated
  using (public.estado_chat_app(utente_id) in ('ativo', 'bloqueado'));
create policy chat_utente_enviar on public.chat_mensagens for insert to authenticated
  with check (do_utente and autor_membro_id is null
              and public.estado_chat_app(utente_id) = 'ativo');

-- Anexos do utente no mesmo bucket e caminho ({espaco_id}/{utente_id}/{ficheiro}).
create policy chat_anexos_utente_ler on storage.objects for select to authenticated
  using (bucket_id = 'chat-anexos' and public.estado_chat_app(public.anexo_utente(name)) in ('ativo', 'bloqueado'));
create policy chat_anexos_utente_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-anexos' and public.estado_chat_app(public.anexo_utente(name)) = 'ativo'
              and public.espaco_do_utente_app(public.anexo_utente(name))::text = (storage.foldername(name))[1]);

-- Conversas do utente (para a lista na app): só as que o médico ativou.
create or replace function public.minhas_conversas()
returns table (
  utente_id uuid,
  espaco_id uuid,
  espaco_nome text,
  profissionais text,
  estado text,
  ultima_mensagem_em timestamptz,
  ultima_mensagem text,
  ultima_do_utente boolean
) language sql stable security definer set search_path = public as $$
  select u.id, u.espaco_id, e.nome,
         (select string_agg(m.nome_exibicao, ', ' order by m.nome_exibicao)
            from public.seguimentos s join public.membros m on m.id = s.membro_id
           where s.utente_id = u.id and m.estado = 'ativo' and m.funcao in ('medico', 'profissional')),
         u.chat_estado,
         ult.criada_em, left(ult.texto, 140), ult.do_utente
  from public.utente_contas uc
  join public.utentes u on u.id = uc.utente_id
  join public.espacos e on e.id = u.espaco_id
  left join lateral (select cm.criada_em, cm.texto, cm.do_utente from public.chat_mensagens cm
                     where cm.utente_id = u.id order by cm.criada_em desc limit 1) ult on true
  where uc.user_id = auth.uid() and u.chat_estado in ('ativo', 'bloqueado')
  order by ult.criada_em desc nulls last
$$;
revoke execute on function public.minhas_conversas() from public, anon;

-- Enviar mensagem a partir da app (preenche o espaço e valida os anexos). Devolve o id da mensagem.
create or replace function public.enviar_mensagem_app(p_utente uuid, p_texto text, p_anexos jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_espaco uuid; v_estado text; v_id uuid; a jsonb;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  if not public.e_conta_do_utente(p_utente) then raise exception 'Sem acesso a esta conversa'; end if;
  select espaco_id, chat_estado into v_espaco, v_estado from public.utentes where id = p_utente;
  if v_estado <> 'ativo' then raise exception 'Conversa indisponível'; end if;
  if jsonb_typeof(coalesce(p_anexos, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_anexos, '[]'::jsonb)) > 5 then
    raise exception 'Anexos inválidos';
  end if;
  if coalesce(trim(p_texto), '') = '' and jsonb_array_length(coalesce(p_anexos, '[]'::jsonb)) = 0 then
    raise exception 'Mensagem vazia';
  end if;
  for a in select * from jsonb_array_elements(coalesce(p_anexos, '[]'::jsonb)) loop
    if not (a->>'path' like v_espaco::text || '/' || p_utente::text || '/%') then
      raise exception 'Anexo fora da conversa';
    end if;
  end loop;
  insert into public.chat_mensagens (espaco_id, utente_id, do_utente, texto, anexos)
  values (v_espaco, p_utente, true, coalesce(p_texto, ''), coalesce(p_anexos, '[]'::jsonb))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.enviar_mensagem_app(uuid, text, jsonb) from public, anon;
