-- Medicação e alergias do utente.
-- Não é a receita oficial (isso exige declaração de conformidade na SPMS): é o registo clínico da
-- medicação, com o número da receita quando foi prescrita na PEM. Os campos seguem as normas da SPMS
-- (DCI, dosagem, forma, posologia, embalagens) para virem a servir de base à receita.
-- Acesso: só profissionais clínicos que seguem o utente. Não se apaga: suspende-se, termina-se,
-- ou marca-se como registo errado. Todas as alterações ficam na auditoria.

create table public.medicacoes (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  dci text not null check (length(trim(dci)) between 1 and 200),
  nome_comercial text check (length(nome_comercial) <= 200),
  dosagem text check (length(dosagem) <= 80),
  forma text check (length(forma) <= 80),
  via text check (length(via) <= 80),
  posologia text not null check (length(trim(posologia)) between 1 and 500),
  embalagens int check (embalagens between 1 and 99),
  inicio date not null default current_date,
  fim date,
  cronica boolean not null default false,
  motivo text check (length(motivo) <= 500),
  origem text not null default 'vivara' check (origem in ('pem_spms', 'externa', 'habitual')),
  numero_receita text check (numero_receita ~ '^[0-9]{10,25}$'),
  estado text not null default 'ativa' check (estado in ('ativa', 'suspensa', 'terminada', 'erro')),
  estado_motivo text check (length(estado_motivo) <= 500),
  estado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);
create index on public.medicacoes (utente_id, estado);

create table public.alergias (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  substancia text not null check (length(trim(substancia)) between 1 and 200),
  reacao text check (length(reacao) <= 300),
  gravidade text not null default 'desconhecida' check (gravidade in ('ligeira', 'moderada', 'grave', 'desconhecida')),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.alergias (utente_id);

alter table public.medicacoes enable row level security;
alter table public.alergias enable row level security;

create trigger medicacoes_mesmo_espaco before insert or update on public.medicacoes
  for each row execute function public.tg_mesmo_espaco();
create trigger alergias_mesmo_espaco before insert or update on public.alergias
  for each row execute function public.tg_mesmo_espaco();
create trigger medicacoes_espaco_imutavel before update on public.medicacoes
  for each row execute function public.tg_espaco_imutavel();
create trigger alergias_espaco_imutavel before update on public.alergias
  for each row execute function public.tg_espaco_imutavel();

-- Clínico ativo deste espaço que segue o utente (avaliado pelas colunas da linha).
create or replace function public.clinico_que_segue(p_espaco uuid, p_utente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros eu
    where eu.espaco_id = p_espaco and eu.user_id = auth.uid() and eu.estado = 'ativo'
      and eu.funcao in ('medico', 'profissional'))
    and public.segue_utente(p_utente)
$$;
revoke execute on function public.clinico_que_segue(uuid, uuid) from public, anon;

create policy medicacoes_ler on public.medicacoes for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy medicacoes_criar on public.medicacoes for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id)
              and autor_id = (public.meu_membro(espaco_id)).id);
create policy medicacoes_alterar on public.medicacoes for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));

create policy alergias_ler on public.alergias for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy alergias_criar on public.alergias for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id)
              and autor_id = (public.meu_membro(espaco_id)).id);
create policy alergias_alterar on public.alergias for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));
-- Sem DELETE: o histórico clínico mantém-se.

-- O autor e a data de criação não mudam; a data de alteração atualiza-se; tudo vai para a auditoria.
create or replace function public.tg_registo_clinico_alterado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    new.autor_id := old.autor_id;
    new.criado_em := old.criado_em;
    new.atualizado_em := now();
    if tg_table_name = 'medicacoes' and new.estado is distinct from old.estado then
      new.estado_em := now();
    end if;
  end if;
  return new;
end $$;

create or replace function public.tg_auditar_registo_clinico()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria (espaco_id, user_id, acao, alvo, detalhe)
  values (new.espaco_id, auth.uid(), tg_table_name || '_' || lower(tg_op), new.id::text,
          case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end);
  return new;
end $$;

revoke execute on function public.tg_registo_clinico_alterado(), public.tg_auditar_registo_clinico()
  from public, anon, authenticated;

create trigger medicacoes_alterado before update on public.medicacoes
  for each row execute function public.tg_registo_clinico_alterado();
create trigger alergias_alterado before update on public.alergias
  for each row execute function public.tg_registo_clinico_alterado();
create trigger medicacoes_auditar after insert or update on public.medicacoes
  for each row execute function public.tg_auditar_registo_clinico();
create trigger alergias_auditar after insert or update on public.alergias
  for each row execute function public.tg_auditar_registo_clinico();
