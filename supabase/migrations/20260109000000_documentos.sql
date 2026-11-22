-- Declarações, atestados e relatórios emitidos pelo portal.
-- Modelos: cada profissional tem os seus; numa clínica pode partilhá-los com a equipa.
-- Documentos emitidos: ficam guardados (não se editam nem apagam), para histórico e nova impressão.
-- Quem vê um documento emitido: o autor e os profissionais clínicos que seguem o utente.
-- A administrativa pode emitir só declarações sem dados de saúde (presença e acompanhante).

create table public.modelos_documento (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  autor_id uuid not null references public.membros(id) on delete cascade,
  tipo text not null check (tipo in ('presenca', 'acompanhante', 'atestado', 'relatorio', 'outro')),
  nome text not null check (length(nome) between 1 and 120),
  corpo text not null check (length(corpo) <= 20000),
  partilhado boolean not null default false,
  criado_em timestamptz not null default now(),
  alterado_em timestamptz not null default now()
);
create index on public.modelos_documento (espaco_id);

create table public.documentos_emitidos (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  consulta_id uuid references public.consultas(id) on delete set null,
  tipo text not null check (tipo in ('presenca', 'acompanhante', 'atestado', 'relatorio', 'outro')),
  titulo text not null check (length(titulo) between 1 and 160),
  corpo text not null check (length(corpo) <= 20000),
  -- Cabeçalho tal como foi impresso (nome, cédula, especialidade, local), para reimprimir igual.
  cabecalho jsonb not null default '{}'::jsonb,
  emitido_em timestamptz not null default now()
);
create index on public.documentos_emitidos (utente_id, emitido_em desc);

alter table public.modelos_documento enable row level security;
alter table public.documentos_emitidos enable row level security;

create trigger documentos_mesmo_espaco before insert on public.documentos_emitidos
  for each row execute function public.tg_mesmo_espaco();

-- Modelos
create policy modelos_ler on public.modelos_documento for select to authenticated
  using (public.e_membro(espaco_id)
         and (autor_id = (public.meu_membro(espaco_id)).id or partilhado));
create policy modelos_criar on public.modelos_documento for insert to authenticated
  with check (autor_id = (public.meu_membro(espaco_id)).id);
create policy modelos_alterar on public.modelos_documento for update to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id)
  with check (autor_id = (public.meu_membro(espaco_id)).id);
create policy modelos_apagar on public.modelos_documento for delete to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id);

-- Documentos emitidos (avaliados pelas colunas da própria linha, para INSERT ... RETURNING funcionar)
create or replace function public.pode_ver_documento_linha(p_espaco uuid, p_autor uuid, p_utente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros eu
    where eu.espaco_id = p_espaco and eu.user_id = auth.uid() and eu.estado = 'ativo'
      and (eu.id = p_autor
           or (eu.funcao in ('medico', 'profissional') and public.segue_utente(p_utente))))
$$;

create or replace function public.pode_emitir_documento(p_espaco uuid, p_autor uuid, p_utente uuid, p_tipo text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros eu
    where eu.espaco_id = p_espaco and eu.user_id = auth.uid() and eu.estado = 'ativo' and eu.id = p_autor
      and ((eu.funcao in ('medico', 'profissional') and public.segue_utente(p_utente))
           or (eu.funcao = 'administrativo' and p_tipo in ('presenca', 'acompanhante'))))
$$;

revoke execute on function public.pode_ver_documento_linha(uuid, uuid, uuid),
  public.pode_emitir_documento(uuid, uuid, uuid, text) from public, anon;

create policy documentos_ler on public.documentos_emitidos for select to authenticated
  using (public.pode_ver_documento_linha(espaco_id, autor_id, utente_id));
create policy documentos_emitir on public.documentos_emitidos for insert to authenticated
  with check (public.pode_emitir_documento(espaco_id, autor_id, utente_id, tipo));
-- Sem UPDATE nem DELETE: um documento emitido fica como foi entregue.

create or replace function public.tg_auditar_documento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria (espaco_id, user_id, acao, alvo, detalhe)
  values (new.espaco_id, auth.uid(), 'documento_emitido', new.id::text,
          jsonb_build_object('tipo', new.tipo, 'utente', new.utente_id));
  return new;
end $$;
revoke execute on function public.tg_auditar_documento() from public, anon, authenticated;
create trigger documentos_auditar after insert on public.documentos_emitidos
  for each row execute function public.tg_auditar_documento();
