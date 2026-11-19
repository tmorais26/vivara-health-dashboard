-- Registo de consentimentos da app do utente (RGPD art. 7.º e 9.º).
--
-- Regras:
--  * consent_events só aceita INSERT, e só pelo servidor (service role). Não há
--    UPDATE nem DELETE para ninguém, nem para o service role: um trigger recusa.
--    Retirar um consentimento é uma linha nova com action = 'withdrawn'.
--  * A data/hora é a do servidor (now() em UTC); o IP vem do pedido HTTP, lido
--    pela função de servidor, nunca do browser.
--  * O utente pode ler os seus próprios registos (RLS); não pode escrever.
--
-- Executar no Supabase: SQL Editor › colar este ficheiro › Run.

create table if not exists public.patient_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 1 and 200),
  invite_code  text check (invite_code is null or char_length(invite_code) <= 64),
  created_at   timestamptz not null default now()
);

create table if not exists public.consent_events (
  id             bigint generated always as identity primary key,
  -- sem "on delete cascade": a prova sobrevive ao apagamento da conta; ver account_closures
  user_id        uuid not null,
  consent_type   text not null check (consent_type ~ '^(age_18|terms|privacy|health_data|marketing|wearable:[a-z0-9_-]+|share:[0-9a-f-]{36}|ai_reading)$'),
  action         text not null check (action in ('granted', 'withdrawn')),
  doc_version    text,           -- p.ex. 'termos-v1', 'privacidade-v1'
  checkbox_id    text,           -- id da caixa no ecrã, p.ex. 'signup-health'
  text_hash      text,           -- sha-256 do texto exato mostrado ao utente
  lang           text check (lang in ('pt', 'en')),
  ip             inet,
  user_agent     text,
  created_at     timestamptz not null default now()
);

create index if not exists consent_events_user_idx on public.consent_events (user_id, consent_type, created_at desc);

create or replace function public.consent_events_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'consent_events é só de acréscimo: não se edita nem se apaga';
end $$;

drop trigger if exists consent_events_no_update on public.consent_events;
create trigger consent_events_no_update before update or delete on public.consent_events
  for each row execute function public.consent_events_immutable();

create table if not exists public.account_closures (
  id               bigint generated always as identity primary key,
  user_id          uuid not null,
  reason           text not null check (reason in ('user_request', 'health_consent_withdrawn')),
  requested_at     timestamptz not null default now(),
  export_until     timestamptz not null default (now() + interval '90 days'),
  deleted_at       timestamptz
);

create index if not exists account_closures_user_idx on public.account_closures (user_id);

-- RLS: leitura só do próprio; sem políticas de escrita (só o service role escreve).
alter table public.patient_profiles enable row level security;
alter table public.consent_events   enable row level security;
alter table public.account_closures enable row level security;

drop policy if exists "own profile" on public.patient_profiles;
create policy "own profile" on public.patient_profiles for select to authenticated using (user_id = auth.uid());

drop policy if exists "own consents" on public.consent_events;
create policy "own consents" on public.consent_events for select to authenticated using (user_id = auth.uid());

drop policy if exists "own closures" on public.account_closures;
create policy "own closures" on public.account_closures for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.consent_events   from anon, authenticated;
revoke insert, update, delete on public.patient_profiles from anon, authenticated;
revoke insert, update, delete on public.account_closures from anon, authenticated;

-- Apagamento depois da janela de exportação (90 dias). Apaga o utilizador do
-- auth (o perfil vai em cascata) e marca o encerramento como concluído. Os
-- registos de consentimento ficam, como prova de que houve consentimento
-- enquanto a conta existiu.
create or replace function public.purge_closed_accounts() returns integer
language plpgsql security definer set search_path = public, auth as $$
declare n integer := 0; r record;
begin
  for r in select id, user_id from public.account_closures where deleted_at is null and export_until <= now() loop
    delete from auth.users where id = r.user_id;
    update public.account_closures set deleted_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.purge_closed_accounts() from public, anon, authenticated;

-- Correr todos os dias às 03:17 UTC (requer a extensão pg_cron ativa em
-- Database › Extensions). Descomentar depois de a ativar:
-- select cron.schedule('purge-closed-accounts', '17 3 * * *', 'select public.purge_closed_accounts()');
