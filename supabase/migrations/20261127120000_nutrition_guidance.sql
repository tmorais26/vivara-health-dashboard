-- Orientação nutricional com IA (app do utente) e validação por profissional.
--
-- Regras:
--  * Cada geração é uma VERSÃO nova; nada se apaga nem se reescreve. O conteúdo
--    gerado pela IA (conteudo) nunca muda; a versão revista pelo profissional
--    fica em conteudo_validado.
--  * Estados: gerado → em_validacao → validado; bloqueado = a app não gerou
--    orientação por segurança (zona crítica, condição sensível…), mas o
--    profissional pode escrevê-la e validá-la.
--  * Só valida um profissional ligado ao utente (recomendação/convite do portal).
--  * O telemóvel lê só as suas versões; escreve só pelo pedido de validação.
--    A geração é feita no servidor (service role).
--  * Auditoria só de acréscimo.
--
-- Não altera tabelas do portal. Altera apenas a lista de tipos do registo de
-- consentimentos (tabela da app) para incluir 'ai_nutricao'.

-- ── Consentimento próprio ────────────────────────────────────────────────────
alter table public.consent_events drop constraint if exists consent_events_consent_type_check;
alter table public.consent_events add constraint consent_events_consent_type_check
  check (consent_type ~ '^(age_18|terms|privacy|health_data|marketing|wearable:[a-z0-9_-]+|share:[0-9a-f-]{36}|ai_reading|ai_nutricao)$');

-- ── Versões da orientação ────────────────────────────────────────────────────
create table if not exists public.orientacoes_nutricionais (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  versao             int not null,
  estado             text not null check (estado in ('gerado', 'em_validacao', 'validado', 'bloqueado')),
  conteudo           jsonb not null,           -- gerado pela IA ({itens, nota}) ou {motivos} quando bloqueado
  entrada            jsonb not null,           -- exatamente o que foi enviado à IA (ou avaliado, se bloqueado)
  entrada_hash       text not null,
  lang               text not null default 'pt' check (lang in ('pt', 'en')),
  modelo             text,
  versao_prompt      text,
  gerado_em          timestamptz not null default now(),
  conteudo_validado  jsonb,                    -- versão revista pelo profissional
  editado            boolean not null default false,
  observacao         text,                     -- nota do profissional ao validar
  validado_por       uuid references auth.users(id) on delete set null,
  validado_por_nome  text,
  validado_em        timestamptz,
  unique (user_id, versao)
);
create index if not exists orientacoes_user_idx on public.orientacoes_nutricionais (user_id, versao desc);

create table if not exists public.pedidos_validacao_nutricao (
  id             uuid primary key default gen_random_uuid(),
  orientacao_id  uuid not null references public.orientacoes_nutricionais(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  estado         text not null default 'pendente' check (estado in ('pendente', 'concluido', 'cancelado')),
  pedido_em      timestamptz not null default now(),
  concluido_em   timestamptz,
  concluido_por  uuid references auth.users(id) on delete set null
);
create unique index if not exists pedidos_um_pendente_por_versao
  on public.pedidos_validacao_nutricao (orientacao_id) where estado = 'pendente';

create table if not exists public.orientacoes_auditoria (
  id             bigint generated always as identity primary key,
  orientacao_id  uuid,
  user_id        uuid,                         -- dono da orientação
  ator_id        uuid,                         -- quem fez (utente, profissional ou null = sistema)
  acao           text not null check (acao in ('gerado', 'bloqueado', 'saida_rejeitada', 'validacao_pedida', 'validado', 'editado')),
  detalhe        jsonb,
  criado_em      timestamptz not null default now()
);
create index if not exists orientacoes_auditoria_idx on public.orientacoes_auditoria (orientacao_id, criado_em);

create or replace function public.orientacoes_auditoria_imutavel() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'orientacoes_auditoria é só de acréscimo';
end $$;
drop trigger if exists orientacoes_auditoria_sem_alteracoes on public.orientacoes_auditoria;
create trigger orientacoes_auditoria_sem_alteracoes before update or delete on public.orientacoes_auditoria
  for each row execute function public.orientacoes_auditoria_imutavel();

-- O conteúdo gerado nunca muda depois de gravado.
create or replace function public.orientacoes_conteudo_imutavel() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.conteudo is distinct from old.conteudo or new.entrada is distinct from old.entrada
     or new.versao is distinct from old.versao or new.user_id is distinct from old.user_id then
    raise exception 'o conteúdo gerado e a entrada de uma versão não se alteram';
  end if;
  return new;
end $$;
drop trigger if exists orientacoes_conteudo_fixo on public.orientacoes_nutricionais;
create trigger orientacoes_conteudo_fixo before update on public.orientacoes_nutricionais
  for each row execute function public.orientacoes_conteudo_imutavel();

-- ── Acesso ───────────────────────────────────────────────────────────────────
alter table public.orientacoes_nutricionais   enable row level security;
alter table public.pedidos_validacao_nutricao enable row level security;
alter table public.orientacoes_auditoria      enable row level security;

drop policy if exists "ler as minhas orientacoes" on public.orientacoes_nutricionais;
create policy "ler as minhas orientacoes" on public.orientacoes_nutricionais
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "ler os meus pedidos" on public.pedidos_validacao_nutricao;
create policy "ler os meus pedidos" on public.pedidos_validacao_nutricao
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.orientacoes_nutricionais, public.pedidos_validacao_nutricao, public.orientacoes_auditoria from anon, authenticated;
revoke select on public.orientacoes_auditoria from anon, authenticated;

-- ── Quem pode validar ────────────────────────────────────────────────────────
-- Profissional ligado ao utente: recomendou-o (código ou convite do portal).
create or replace function public.e_profissional_do_utente(p_prof uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.recomendacoes r
    where r.convidante_id = p_prof and r.convidado_id = p_user
      and r.convidante_tipo = 'profissional' and coalesce(r.estado, '') <> 'anulado'
  ) or exists (
    select 1 from public.convites_app c where c.convidante_id = p_prof and c.usado_por = p_user
  )
$$;

create or replace function public.tem_profissional_ligado(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.recomendacoes r
    where r.convidado_id = p_user and r.convidante_tipo = 'profissional' and coalesce(r.estado, '') <> 'anulado'
  ) or exists (select 1 from public.convites_app c where c.usado_por = p_user)
$$;

-- ── App: pedir validação (com a sessão do utente) ───────────────────────────
create or replace function public.pedir_validacao_nutricao(p_orientacao uuid) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orientacoes_nutricionais%rowtype;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  select * into o from public.orientacoes_nutricionais where id = p_orientacao for update;
  if o.id is null or o.user_id <> auth.uid() then return 'nao_encontrada'; end if;
  if o.estado = 'validado' then return 'ja_validada'; end if;
  if exists (select 1 from public.pedidos_validacao_nutricao where orientacao_id = o.id and estado = 'pendente') then return 'ja_pedido'; end if;
  if not public.tem_profissional_ligado(auth.uid()) then return 'sem_profissional'; end if;
  insert into public.pedidos_validacao_nutricao (orientacao_id, user_id) values (o.id, o.user_id);
  if o.estado = 'gerado' then
    update public.orientacoes_nutricionais set estado = 'em_validacao' where id = o.id;
  end if;
  insert into public.orientacoes_auditoria (orientacao_id, user_id, ator_id, acao) values (o.id, o.user_id, auth.uid(), 'validacao_pedida');
  return 'ok';
end $$;

-- ── Portal: fila de validação do profissional com sessão ─────────────────────
create or replace function public.fila_validacao_nutricao()
returns table (
  pedido_id uuid, orientacao_id uuid, utente_user_id uuid, utente_nome text, portal_utente_id uuid,
  versao int, estado text, pedido_em timestamptz, gerado_em timestamptz,
  entrada jsonb, conteudo jsonb, lang text
)
language sql stable security definer set search_path = public as $$
  select p.id, o.id, o.user_id, pr.full_name,
         (select c.utente_id from public.convites_app c where c.usado_por = o.user_id and c.convidante_id = auth.uid() limit 1),
         o.versao, o.estado, p.pedido_em, o.gerado_em, o.entrada, o.conteudo, o.lang
  from public.pedidos_validacao_nutricao p
  join public.orientacoes_nutricionais o on o.id = p.orientacao_id
  left join public.profiles pr on pr.id = o.user_id
  where p.estado = 'pendente'
    and auth.uid() is not null
    and public.e_profissional_do_utente(auth.uid(), o.user_id)
  order by p.pedido_em
$$;

-- Validar (com ou sem edição). p_conteudo: {itens:[{tipo, alimento, marcador, porque}], nota}.
create or replace function public.validar_orientacao_nutricional(p_orientacao uuid, p_conteudo jsonb, p_observacao text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orientacoes_nutricionais%rowtype;
  v_nome text;
  v_editado boolean;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  select * into o from public.orientacoes_nutricionais where id = p_orientacao for update;
  if o.id is null then return 'nao_encontrada'; end if;
  if not public.e_profissional_do_utente(auth.uid(), o.user_id) then return 'sem_permissao'; end if;
  if not exists (select 1 from public.pedidos_validacao_nutricao where orientacao_id = o.id and estado = 'pendente') then return 'sem_pedido'; end if;
  -- Verificações em passos separados: com «itens» em falta, uma condição única
  -- dava NULL e deixava passar conteúdo inválido.
  if p_conteudo is null or coalesce(jsonb_typeof(p_conteudo -> 'itens'), '') <> 'array' then
    return 'conteudo_invalido';
  end if;
  if jsonb_array_length(p_conteudo -> 'itens') = 0 or jsonb_array_length(p_conteudo -> 'itens') > 20 then
    return 'conteudo_invalido';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_conteudo -> 'itens') it
    where coalesce(it ->> 'tipo', '') not in ('privilegiar', 'reduzir')
       or coalesce(length(trim(it ->> 'alimento')), 0) = 0
       or coalesce(length(it ->> 'alimento'), 0) > 120
       or coalesce(length(it ->> 'porque'), 0) > 500
  ) then
    return 'conteudo_invalido';
  end if;

  select coalesce(
    (select nome from public.medico_perfis where user_id = auth.uid()),
    (select nome_exibicao from public.membros where user_id = auth.uid() order by criado_em limit 1),
    (select full_name from public.profiles where id = auth.uid())
  ) into v_nome;
  v_editado := p_conteudo is distinct from o.conteudo;

  update public.orientacoes_nutricionais
     set estado = 'validado', conteudo_validado = p_conteudo, editado = v_editado,
         observacao = nullif(trim(coalesce(p_observacao, '')), ''),
         validado_por = auth.uid(), validado_por_nome = v_nome, validado_em = now()
   where id = o.id;
  update public.pedidos_validacao_nutricao
     set estado = 'concluido', concluido_em = now(), concluido_por = auth.uid()
   where orientacao_id = o.id and estado = 'pendente';
  insert into public.orientacoes_auditoria (orientacao_id, user_id, ator_id, acao, detalhe)
    values (o.id, o.user_id, auth.uid(), case when v_editado then 'editado' else 'validado' end,
            jsonb_build_object('validado_por_nome', v_nome));
  return 'ok';
end $$;

revoke all on function public.e_profissional_do_utente(uuid, uuid) from public, anon, authenticated;
revoke all on function public.tem_profissional_ligado(uuid)         from public, anon;
revoke all on function public.pedir_validacao_nutricao(uuid)        from public, anon;
revoke all on function public.fila_validacao_nutricao()             from public, anon;
revoke all on function public.validar_orientacao_nutricional(uuid, jsonb, text) from public, anon;
grant execute on function public.pedir_validacao_nutricao(uuid)        to authenticated;
grant execute on function public.fila_validacao_nutricao()             to authenticated;
grant execute on function public.validar_orientacao_nutricional(uuid, jsonb, text) to authenticated;
revoke all on function public.tem_profissional_ligado(uuid) from authenticated;
