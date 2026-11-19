-- Perfil profissional do médico (cédula validada manualmente mais tarde).
create table public.medico_perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  especialidade text,
  cedula_profissional text,
  clinica text,
  cedula_validada boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Aceitação de documentos legais e declarações: uma linha por documento/caixa aceite.
-- Escrita apenas pelo servidor (service role), que regista o IP.
create table public.medico_consentimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('documento', 'declaracao')),
  codigo text not null,          -- ex.: 'termos', 'acordo', 'habilitacao'
  versao text not null,          -- ex.: 'termos-v1'
  caixa_id text not null,        -- ID da caixa de aceitação (ex.: 'aceite-termos-acordo')
  texto_caixa text not null,     -- texto exato apresentado no momento da aceitação
  aceite_em timestamptz not null default now(), -- UTC
  ip text
);
create index on public.medico_consentimentos (user_id, codigo, aceite_em desc);

-- Consentimento de marketing, separado e revogável. Histórico: uma linha por alteração.
create table public.medico_consentimento_marketing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aceite boolean not null,
  texto_caixa text,
  alterado_em timestamptz not null default now(), -- UTC
  ip text
);
create index on public.medico_consentimento_marketing (user_id, alterado_em desc);

-- Confirmação de fundamento legal, por utente registado.
create table public.medico_utente_fundamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  utente_ref text not null,
  texto_confirmado text not null,
  confirmado_em timestamptz not null default now(), -- UTC
  ip text
);
create index on public.medico_utente_fundamento (user_id, utente_ref);

alter table public.medico_perfis enable row level security;
alter table public.medico_consentimentos enable row level security;
alter table public.medico_consentimento_marketing enable row level security;
alter table public.medico_utente_fundamento enable row level security;

-- O médico só lê as suas próprias linhas; não há políticas de escrita (só service role).
create policy "ler proprio perfil" on public.medico_perfis for select using (user_id = auth.uid());
create policy "ler proprios consentimentos" on public.medico_consentimentos for select using (user_id = auth.uid());
create policy "ler proprio marketing" on public.medico_consentimento_marketing for select using (user_id = auth.uid());
create policy "ler proprios fundamentos" on public.medico_utente_fundamento for select using (user_id = auth.uid());
