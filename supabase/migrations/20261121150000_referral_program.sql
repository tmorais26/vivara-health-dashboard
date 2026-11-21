-- Programa de recomendação por código pessoal (app do utente + portal do médico).
--
-- Regras (aplicadas na base de dados, não no telemóvel):
--  * Utente recomenda utente: os dois ganham 1 mês. Utente recomenda médico: os
--    dois ganham 1 mês. Médico recomenda utente: só o utente ganha.
--  * O mês só é atribuído depois do PRIMEIRO pagamento de quem foi convidado.
--  * No máximo 12 meses grátis por pessoa e por ano civil.
--  * Cada pessoa usa UM código, uma só vez (referrals.referee_id é único).
--  * Meio de pagamento repetido não conta.
--  * Nenhuma destas tabelas é legível ou escrevível pelo telemóvel: só o servidor
--    (service role) lê e escreve, e só devolve contagens, nunca identidades.
--
-- Os meses ficam registados aqui; a aplicação à subscrição (Stripe) faz-se na
-- parte 2 e preenche referral_credits.applied_at.

-- ── Geração do código ────────────────────────────────────────────────────────
-- 31 símbolos (sem 0/O/1/I/L). Usa-se rejeição (bytes < 248 = 31×8) para não
-- enviesar a distribuição.
create or replace function public.gen_referral_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  chars text := '';
  b bytea;
  i int;
  v int;
begin
  while length(chars) < 8 loop
    b := uuid_send(gen_random_uuid());           -- 16 bytes aleatórios
    for i in 0..15 loop
      v := get_byte(b, i);
      if v < 248 then
        chars := chars || substr(alphabet, (v % 31) + 1, 1);
        exit when length(chars) = 8;
      end if;
    end loop;
  end loop;
  return 'VIV-' || substr(chars, 1, 4) || '-' || substr(chars, 5, 4);
end $$;

-- ── Tabelas ──────────────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  code        text primary key check (code ~ '^VIV-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$'),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  owner_kind  text not null check (owner_kind in ('patient', 'doctor')),
  created_at  timestamptz not null default now(),
  unique (owner_id, owner_kind)
);

create table if not exists public.referrals (
  id               bigint generated always as identity primary key,
  code             text not null references public.referral_codes(code),
  referrer_id      uuid references auth.users(id) on delete set null,
  referrer_kind    text not null check (referrer_kind in ('patient', 'doctor')),
  referee_id       uuid unique references auth.users(id) on delete set null,   -- um código por pessoa
  referee_kind     text not null default 'patient' check (referee_kind in ('patient', 'doctor')),
  email_norm_hash  text,                    -- sha-256 do email normalizado do convidado
  status           text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  reject_reason    text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id, status);
-- A mesma pessoa não conta duas vezes para o mesmo convidante.
create unique index if not exists referrals_unique_email_per_referrer
  on public.referrals (referrer_id, email_norm_hash) where email_norm_hash is not null and status <> 'rejected';

create table if not exists public.referral_credits (
  id            bigint generated always as identity primary key,
  referral_id   bigint not null references public.referrals(id),
  user_id       uuid references auth.users(id) on delete set null,
  role          text not null check (role in ('referrer', 'referee')),
  months        int not null default 1 check (months = 1),
  granted_year  int not null,                  -- ano civil (UTC) em que foi atribuído
  granted_at    timestamptz not null default now(),
  kind          text check (kind in ('balance_credit', 'period_extension')),
  applied_at    timestamptz,                   -- quando entrou na subscrição
  provider_ref  text,
  unique (referral_id, role)
);
create index if not exists referral_credits_user_year_idx on public.referral_credits (user_id, granted_year);

-- Um meio de pagamento (impressão digital em hash) só pode pertencer a uma conta.
create table if not exists public.payment_fingerprints (
  fingerprint_hash  text primary key,
  user_id           uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- Limite de pedidos (validação de códigos sem sessão).
create table if not exists public.rate_limit_hits (
  id      bigint generated always as identity primary key,
  bucket  text not null,
  at      timestamptz not null default now()
);
create index if not exists rate_limit_hits_idx on public.rate_limit_hits (bucket, at desc);

-- Sem acesso direto pelo telemóvel (RLS ligada e sem políticas).
alter table public.referral_codes        enable row level security;
alter table public.referrals             enable row level security;
alter table public.referral_credits      enable row level security;
alter table public.payment_fingerprints  enable row level security;
alter table public.rate_limit_hits       enable row level security;

revoke all on public.referral_codes, public.referrals, public.referral_credits,
              public.payment_fingerprints, public.rate_limit_hits from anon, authenticated;

-- ── Funções (só o servidor, com a chave de serviço) ──────────────────────────

-- Código pessoal de uma pessoa: cria-o na primeira vez, devolve sempre o mesmo.
create or replace function public.ensure_referral_code(p_user uuid, p_kind text) returns text
language plpgsql security definer set search_path = public as $$
declare c text; tries int := 0;
begin
  if p_kind not in ('patient', 'doctor') then raise exception 'tipo inválido'; end if;
  select code into c from public.referral_codes where owner_id = p_user and owner_kind = p_kind;
  if c is not null then return c; end if;
  loop
    tries := tries + 1;
    begin
      insert into public.referral_codes (code, owner_id, owner_kind)
        values (public.gen_referral_code(), p_user, p_kind) returning code into c;
      return c;
    exception when unique_violation then
      select code into c from public.referral_codes where owner_id = p_user and owner_kind = p_kind;
      if c is not null then return c; end if;      -- corrida: outro pedido criou-o
      if tries >= 5 then raise; end if;             -- colisão de código: tenta outro
    end;
  end loop;
end $$;

-- Limite de pedidos: devolve true se ainda há margem (e regista o pedido).
create or replace function public.rate_limit_hit(p_bucket text, p_limit int, p_window interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.rate_limit_hits where at < now() - interval '1 day';
  select count(*) into n from public.rate_limit_hits where bucket = p_bucket and at > now() - p_window;
  if n >= p_limit then return false; end if;
  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end $$;

-- Regista que alguém usou um código ao criar a conta (estado «pendente»).
-- Recusa: código inexistente, o próprio código, conta já com código, o mesmo
-- email normalizado do convidante (ou já usado antes para este convidante).
create or replace function public.register_referral(p_code text, p_referee uuid, p_referee_kind text, p_email_norm_hash text) returns text
language plpgsql security definer set search_path = public as $$
declare rc public.referral_codes%rowtype;
begin
  select * into rc from public.referral_codes where code = p_code;
  if not found then return 'invalid_code'; end if;
  if rc.owner_id = p_referee then return 'own_code'; end if;
  if exists (select 1 from public.referrals where referee_id = p_referee) then return 'already_used'; end if;
  begin
    insert into public.referrals (code, referrer_id, referrer_kind, referee_id, referee_kind, email_norm_hash)
      values (rc.code, rc.owner_id, rc.owner_kind, p_referee, p_referee_kind, p_email_norm_hash);
  exception when unique_violation then
    return 'duplicate_account';
  end;
  return 'ok';
end $$;

-- Regista o meio de pagamento (hash da impressão digital) de uma conta. O
-- servidor chama-a em TODO o primeiro pagamento, com ou sem recomendação, para
-- que um meio já usado por outra conta seja sempre detetado. Devolve false se
-- esse meio já pertence a outra conta.
create or replace function public.record_payment_fingerprint(p_user uuid, p_hash text) returns boolean
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if p_hash is null then return true; end if;
  insert into public.payment_fingerprints (fingerprint_hash, user_id) values (p_hash, p_user)
    on conflict (fingerprint_hash) do nothing;
  select user_id into owner from public.payment_fingerprints where fingerprint_hash = p_hash;
  return owner is not distinct from p_user;
end $$;

-- Primeiro pagamento de quem foi convidado: atribui os meses, tudo numa só
-- operação. Devolve uma linha por mês atribuído (vazio se não há nada a dar).
-- p_year só existe para os testes; em produção é o ano civil UTC atual.
create or replace function public.referral_on_first_payment(
  p_user uuid, p_fingerprint_hash text default null, p_year int default null
) returns table (credit_id bigint, credited_user uuid, credit_role text)
language plpgsql security definer set search_path = public as $$
declare
  r public.referrals%rowtype;
  yr int := coalesce(p_year, extract(year from (now() at time zone 'utc'))::int);
  cid bigint;
begin
  select * into r from public.referrals where referee_id = p_user and status = 'pending' for update;
  if not found then return; end if;

  -- Meio de pagamento já usado por outra conta: não conta.
  if not public.record_payment_fingerprint(p_user, p_fingerprint_hash) then
    update public.referrals set status = 'rejected', reject_reason = 'duplicate_payment_method' where id = r.id;
    return;
  end if;

  -- Quem chega (sempre) e quem recomenda (exceto se for um médico a recomendar).
  perform pg_advisory_xact_lock(hashtext('referral:' || p_user::text));
  if (select count(*) from public.referral_credits where user_id = p_user and granted_year = yr) < 12 then
    insert into public.referral_credits (referral_id, user_id, role, granted_year)
      values (r.id, p_user, 'referee', yr) returning id into cid;
    credit_id := cid; credited_user := p_user; credit_role := 'referee'; return next;
  end if;

  if r.referrer_id is not null and r.referrer_kind <> 'doctor' then
    perform pg_advisory_xact_lock(hashtext('referral:' || r.referrer_id::text));
    if (select count(*) from public.referral_credits where user_id = r.referrer_id and granted_year = yr) < 12 then
      insert into public.referral_credits (referral_id, user_id, role, granted_year)
        values (r.id, r.referrer_id, 'referrer', yr) returning id into cid;
      credit_id := cid; credited_user := r.referrer_id; credit_role := 'referrer'; return next;
    end if;
  end if;

  update public.referrals set status = 'completed', completed_at = now() where id = r.id;
end $$;

-- Resumo de quem recomenda: só números e datas, nunca identidades.
create or replace function public.referral_summary(p_user uuid, p_year int default null) returns json
language sql stable security definer set search_path = public as $$
  with yr as (select coalesce(p_year, extract(year from (now() at time zone 'utc'))::int) as y)
  select json_build_object(
    'invited',   (select count(*) from public.referrals where referrer_id = p_user and status <> 'rejected'),
    'pending',   (select count(*) from public.referrals where referrer_id = p_user and status = 'pending'),
    'completed', (select count(*) from public.referrals where referrer_id = p_user and status = 'completed'),
    'monthsThisYear', (select count(*) from public.referral_credits c, yr where c.user_id = p_user and c.granted_year = yr.y),
    'credits', coalesce((
      select json_agg(json_build_object('grantedAt', c.granted_at, 'appliedAt', c.applied_at) order by c.granted_at desc)
      from public.referral_credits c, yr where c.user_id = p_user and c.granted_year = yr.y
    ), '[]'::json)
  );
$$;

revoke all on function public.gen_referral_code()                       from public, anon, authenticated;
revoke all on function public.ensure_referral_code(uuid, text)          from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, int, interval)       from public, anon, authenticated;
revoke all on function public.register_referral(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.referral_on_first_payment(uuid, text, int) from public, anon, authenticated;
revoke all on function public.record_payment_fingerprint(uuid, text)    from public, anon, authenticated;
revoke all on function public.referral_summary(uuid, int)               from public, anon, authenticated;
