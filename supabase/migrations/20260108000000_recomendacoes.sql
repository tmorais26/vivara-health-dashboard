-- Programa de recomendação por código pessoal.
-- Regras: médico→utente: só o utente ganha 1 mês; médico→médico: ambos; utente→médico: o médico ganha.
-- O mês só é atribuído depois do primeiro pagamento de quem foi convidado; máx. 12 meses por ano.
-- Os meses ficam "por aplicar" até a integração de pagamentos os aplicar no prestador.

create table public.codigos_recomendacao (
  user_id uuid primary key references auth.users(id) on delete cascade,
  codigo text not null unique check (codigo ~ '^VIV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$'),
  titular text not null check (titular in ('profissional', 'utente')),
  criado_em timestamptz not null default now()
);

create table public.recomendacoes (
  id uuid primary key default gen_random_uuid(),
  convidante_id uuid not null references auth.users(id) on delete cascade,
  convidante_tipo text not null check (convidante_tipo in ('profissional', 'utente')),
  convidado_id uuid not null unique references auth.users(id) on delete cascade, -- um código por conta
  convidado_tipo text not null check (convidado_tipo in ('profissional', 'utente')),
  origem text not null check (origem in ('codigo', 'convite_portal')),
  estado text not null default 'registado' check (estado in ('registado', 'pago', 'anulado')),
  motivo_anulacao text,
  registado_em timestamptz not null default now(),
  primeiro_pagamento_em timestamptz,
  check (convidante_id <> convidado_id),
  check (not (convidante_tipo = 'utente' and convidado_tipo = 'utente'))
);
create index on public.recomendacoes (convidante_id);

create table public.meses_gratis (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null references auth.users(id) on delete cascade,
  recomendacao_id uuid not null references public.recomendacoes(id) on delete cascade,
  ano int not null,
  estado text not null check (estado in ('por_aplicar', 'aplicado', 'limite_atingido')),
  referencia_prestador text,
  criado_em timestamptz not null default now(),
  aplicado_em timestamptz,
  unique (beneficiario_id, recomendacao_id)
);
create index on public.meses_gratis (beneficiario_id, ano);

create table public.recomendacao_declaracoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  texto text not null,
  aceite_em timestamptz not null default now(),
  ip text
);

-- Convite enviado pelo portal a um utente registado pelo médico. Só guarda o token e a ligação
-- ao médico; os dados do utente continuam no registo clínico do médico.
create table public.convites_app (
  token uuid primary key default gen_random_uuid(),
  convidante_id uuid not null references auth.users(id) on delete cascade,
  utente_id uuid references public.utentes(id) on delete set null,
  criado_em timestamptz not null default now(),
  usado_em timestamptz,
  usado_por uuid references auth.users(id) on delete set null
);
create index on public.convites_app (convidante_id);

alter table public.codigos_recomendacao enable row level security;
alter table public.recomendacoes enable row level security;
alter table public.meses_gratis enable row level security;
alter table public.recomendacao_declaracoes enable row level security;
alter table public.convites_app enable row level security;

-- Cada pessoa vê só o seu código e a sua declaração. Recomendações, meses e convites
-- só são acessíveis por funções que devolvem totais (nunca identidades).
create policy codigo_proprio on public.codigos_recomendacao for select to authenticated using (user_id = (select auth.uid()));
create policy declaracao_propria on public.recomendacao_declaracoes for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Códigos
-- ---------------------------------------------------------------------------

-- 8 caracteres de um alfabeto de 32 (sem 0/O/1/I): 256 é múltiplo de 32, logo sem enviesamento.
create or replace function public.gerar_codigo_recomendacao()
returns text language plpgsql volatile set search_path = public, extensions as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  s text := '';
  i int;
begin
  for i in 0..7 loop
    s := s || substr(alfabeto, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return 'VIV-' || substr(s, 1, 4) || '-' || substr(s, 5, 4);
end $$;

create or replace function public.garantir_codigo(p_user uuid, p_titular text)
returns text language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select codigo into v from public.codigos_recomendacao where user_id = p_user;
  if v is not null then return v; end if;
  loop
    begin
      insert into public.codigos_recomendacao (user_id, codigo, titular)
      values (p_user, public.gerar_codigo_recomendacao(), p_titular)
      returning codigo into v;
      return v;
    exception when unique_violation then
      select codigo into v from public.codigos_recomendacao where user_id = p_user;
      if v is not null then return v; end if; -- corrida: outro pedido criou-o
    end;
  end loop;
end $$;
revoke execute on function public.garantir_codigo(uuid, text) from public, anon, authenticated;

-- Código do profissional autenticado (criado na primeira vez, se faltar).
create or replace function public.meu_codigo()
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  if not exists (select 1 from public.membros where user_id = auth.uid())
     and not exists (select 1 from public.medico_perfis where user_id = auth.uid()) then
    raise exception 'Só profissionais têm código no portal';
  end if;
  return public.garantir_codigo(auth.uid(), 'profissional');
end $$;
revoke execute on function public.meu_codigo() from public, anon;

-- Gerado ao criar a conta profissional (perfil) ou ao entrar num espaço.
create or replace function public.tg_codigo_profissional()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.garantir_codigo(new.user_id, 'profissional');
  return new;
end $$;
create trigger codigo_ao_criar_perfil after insert on public.medico_perfis
  for each row execute function public.tg_codigo_profissional();
create trigger codigo_ao_entrar_espaco after insert on public.membros
  for each row execute function public.tg_codigo_profissional();
revoke execute on function public.tg_codigo_profissional() from public, anon, authenticated;

-- Validação em tempo real no registo: só diz se existe, nunca de quem é.
create or replace function public.validar_codigo(p_codigo text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.codigos_recomendacao where codigo = upper(trim(p_codigo)))
$$;
grant execute on function public.validar_codigo(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Registo de uma recomendação (só servidor). Usar um código só no registo, uma vez,
-- nunca o próprio; contas repetidas (mesmo email normalizado) não contam.
-- ---------------------------------------------------------------------------
create or replace function public.email_normalizado(p_email text)
returns text language sql immutable set search_path = public as $$
  select case
    when split_part(lower(p_email), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(p_email), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(p_email), '@', 1), '+', 1) || '@' || split_part(lower(p_email), '@', 2)
  end
$$;

create or replace function public.registar_recomendacao(p_convidado uuid, p_codigo text, p_convidado_tipo text)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_cod public.codigos_recomendacao;
  v_email text;
  v_criado timestamptz;
begin
  select * into v_cod from public.codigos_recomendacao where codigo = upper(trim(p_codigo));
  if v_cod.user_id is null then return 'codigo_invalido'; end if;
  if v_cod.user_id = p_convidado then return 'proprio_codigo'; end if;
  if v_cod.titular = 'utente' and p_convidado_tipo = 'utente' then return 'nao_aplicavel'; end if;
  if exists (select 1 from public.recomendacoes where convidado_id = p_convidado) then return 'ja_usado'; end if;
  select email, created_at into v_email, v_criado from auth.users where id = p_convidado;
  if v_criado < now() - interval '7 days' then return 'fora_do_registo'; end if;
  insert into public.recomendacoes (convidante_id, convidante_tipo, convidado_id, convidado_tipo, origem, estado, motivo_anulacao)
  values (
    v_cod.user_id, v_cod.titular, p_convidado, p_convidado_tipo, 'codigo',
    case when exists (
      select 1 from auth.users u
      where u.id <> p_convidado and public.email_normalizado(u.email) = public.email_normalizado(v_email)
    ) then 'anulado' else 'registado' end,
    case when exists (
      select 1 from auth.users u
      where u.id <> p_convidado and public.email_normalizado(u.email) = public.email_normalizado(v_email)
    ) then 'conta_repetida' end
  );
  return 'ok';
end $$;
revoke execute on function public.registar_recomendacao(uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Primeiro pagamento → meses grátis (só servidor / integração de pagamentos).
-- ---------------------------------------------------------------------------
create or replace function public.conceder_mes(p_beneficiario uuid, p_recomendacao uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_ano int := extract(year from now() at time zone 'Europe/Lisbon');
  v_usados int;
  v_estado text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_beneficiario::text, 0));
  select count(*) into v_usados from public.meses_gratis
  where beneficiario_id = p_beneficiario and ano = v_ano and estado in ('por_aplicar', 'aplicado');
  v_estado := case when v_usados >= 12 then 'limite_atingido' else 'por_aplicar' end;
  insert into public.meses_gratis (beneficiario_id, recomendacao_id, ano, estado)
  values (p_beneficiario, p_recomendacao, v_ano, v_estado)
  on conflict (beneficiario_id, recomendacao_id) do nothing;
  return v_estado;
end $$;
revoke execute on function public.conceder_mes(uuid, uuid) from public, anon, authenticated;

create or replace function public.registar_primeiro_pagamento(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.recomendacoes;
begin
  select * into r from public.recomendacoes where convidado_id = p_user and estado = 'registado' for update;
  if r.id is null then return; end if;
  update public.recomendacoes set estado = 'pago', primeiro_pagamento_em = now() where id = r.id;
  -- Quem foi convidado ganha sempre um mês.
  perform public.conceder_mes(r.convidado_id, r.id);
  -- Quem convidou só ganha entre profissionais (médico→médico). Nunca por recomendar utentes.
  if r.convidante_tipo = 'profissional' and r.convidado_tipo = 'profissional' then
    perform public.conceder_mes(r.convidante_id, r.id);
  end if;
end $$;
revoke execute on function public.registar_primeiro_pagamento(uuid) from public, anon, authenticated;

-- A integração de pagamentos marca o mês como aplicado no prestador.
create or replace function public.marcar_mes_aplicado(p_mes uuid, p_referencia text)
returns void language sql security definer set search_path = public as $$
  update public.meses_gratis set estado = 'aplicado', aplicado_em = now(), referencia_prestador = p_referencia
  where id = p_mes and estado = 'por_aplicar'
$$;
revoke execute on function public.marcar_mes_aplicado(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Totais (nunca identidades)
-- ---------------------------------------------------------------------------
create or replace function public.resumo_recomendacoes()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'utentes', (select count(*) from public.recomendacoes
                where convidante_id = auth.uid() and convidado_tipo = 'utente' and origem = 'codigo' and estado <> 'anulado'),
    'medicos', (select count(*) from public.recomendacoes
                where convidante_id = auth.uid() and convidado_tipo = 'profissional' and estado <> 'anulado'),
    'meses_ano', (select count(*) from public.meses_gratis
                  where beneficiario_id = auth.uid() and ano = extract(year from now() at time zone 'Europe/Lisbon')
                    and estado in ('por_aplicar', 'aplicado')),
    'limite', 12
  )
$$;
revoke execute on function public.resumo_recomendacoes() from public, anon;

-- Vista agregada para a administração da clínica: só totais da equipa.
create or replace function public.resumo_recomendacoes_clinica(p_espaco uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin(p_espaco) then raise exception 'Sem permissão'; end if;
  return jsonb_build_object(
    'profissionais', (select count(*) from public.membros where espaco_id = p_espaco and estado = 'ativo'),
    'utentes', (select count(*) from public.recomendacoes r join public.membros m on m.user_id = r.convidante_id
                where m.espaco_id = p_espaco and r.convidado_tipo = 'utente' and r.origem = 'codigo' and r.estado <> 'anulado'),
    'medicos', (select count(*) from public.recomendacoes r join public.membros m on m.user_id = r.convidante_id
                where m.espaco_id = p_espaco and r.convidado_tipo = 'profissional' and r.estado <> 'anulado')
  );
end $$;
revoke execute on function public.resumo_recomendacoes_clinica(uuid) from public, anon;

-- Declaração na primeira partilha (o IP é registado pelo servidor).
create or replace function public.ja_declarou_recomendacao()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recomendacao_declaracoes where user_id = auth.uid())
$$;
revoke execute on function public.ja_declarou_recomendacao() from public, anon;

-- ---------------------------------------------------------------------------
-- Chamadas a partir das apps (com a sessão de quem se acabou de registar)
-- ---------------------------------------------------------------------------

-- Tipo de conta: profissional (portal) ou utente (app).
create or replace function public.tipo_conta(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.membros where user_id = p_user)
      or exists (select 1 from public.medico_perfis where user_id = p_user)
      or exists (select 1 from public.profiles where id = p_user and role = 'physician') then 'profissional'
    else 'utente'
  end
$$;
revoke execute on function public.tipo_conta(uuid) from public, anon, authenticated;

-- Usar um código no registo (portal ou app). Devolve 'ok' ou o motivo de recusa.
create or replace function public.usar_codigo(p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  return public.registar_recomendacao(auth.uid(), p_codigo, public.tipo_conta(auth.uid()));
end $$;
revoke execute on function public.usar_codigo(text) from public, anon;

-- Código do utente (app). O utente recomenda o seu médico: o médico ganha o 1.º mês.
create or replace function public.meu_codigo_utente()
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  if public.tipo_conta(auth.uid()) <> 'utente' then raise exception 'Só para contas de utente'; end if;
  return public.garantir_codigo(auth.uid(), 'utente');
end $$;
revoke execute on function public.meu_codigo_utente() from public, anon;

-- O utente que recebeu um convite do portal regista-se na app com o token:
-- fica associado ao médico (médico→utente: só o utente ganha o mês).
create or replace function public.aceitar_convite_app(p_token uuid)
returns text language plpgsql security definer set search_path = public, auth as $$
declare c public.convites_app; v_criado timestamptz;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  select * into c from public.convites_app where token = p_token for update;
  if c.token is null or c.usado_em is not null then return 'convite_invalido'; end if;
  if c.convidante_id = auth.uid() then return 'proprio_codigo'; end if;
  if public.tipo_conta(auth.uid()) <> 'utente' then return 'nao_aplicavel'; end if;
  if exists (select 1 from public.recomendacoes where convidado_id = auth.uid()) then return 'ja_usado'; end if;
  select created_at into v_criado from auth.users where id = auth.uid();
  if v_criado < now() - interval '7 days' then return 'fora_do_registo'; end if;
  update public.convites_app set usado_em = now(), usado_por = auth.uid() where token = p_token;
  insert into public.recomendacoes (convidante_id, convidante_tipo, convidado_id, convidado_tipo, origem)
  values (c.convidante_id, 'profissional', auth.uid(), 'utente', 'convite_portal');
  return 'ok';
end $$;
revoke execute on function public.aceitar_convite_app(uuid) from public, anon;
