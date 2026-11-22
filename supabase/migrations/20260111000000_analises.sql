-- Análises e exames do utente.
-- analises: uma colheita/relatório (data, laboratório, ficheiro opcional).
-- resultados: um valor por marcador, com o intervalo de referência do próprio laboratório.
-- alvos_marcador: alvo definido pelo profissional para aquele utente (com justificação).
-- Acesso: só profissionais clínicos que seguem o utente (como a medicação). Não se apaga:
-- uma análise registada por engano marca-se como "erro". Tudo vai para a auditoria.

create table public.analises (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  data_colheita date not null,
  laboratorio text check (length(laboratorio) <= 200),
  tipo text not null default 'analises' check (tipo in ('analises', 'imagem', 'outro')),
  titulo text check (length(titulo) <= 200),
  notas text check (length(notas) <= 4000),
  ficheiro_path text,
  ficheiro_nome text check (length(ficheiro_nome) <= 200),
  estado text not null default 'valida' check (estado in ('valida', 'erro')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.analises (utente_id, data_colheita desc);

create table public.resultados (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references public.analises(id) on delete cascade,
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  marcador text not null check (length(trim(marcador)) between 1 and 120),
  valor numeric,
  valor_texto text check (length(valor_texto) <= 200),
  unidade text check (length(unidade) <= 40),
  ref_min numeric,
  ref_max numeric,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (valor is not null or valor_texto is not null),
  check (ref_min is null or ref_max is null or ref_min <= ref_max)
);
create index on public.resultados (utente_id, marcador);
create index on public.resultados (analise_id);

create table public.alvos_marcador (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  marcador text not null check (length(trim(marcador)) between 1 and 120),
  alvo_min numeric,
  alvo_max numeric,
  justificacao text check (length(justificacao) <= 1000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (utente_id, marcador),
  check (alvo_min is not null or alvo_max is not null),
  check (alvo_min is null or alvo_max is null or alvo_min <= alvo_max)
);

alter table public.analises enable row level security;
alter table public.resultados enable row level security;
alter table public.alvos_marcador enable row level security;

-- Mesmo espaço do utente; espaço imutável.
create trigger analises_mesmo_espaco before insert or update on public.analises
  for each row execute function public.tg_mesmo_espaco();
create trigger resultados_mesmo_espaco before insert or update on public.resultados
  for each row execute function public.tg_mesmo_espaco();
create trigger alvos_mesmo_espaco before insert or update on public.alvos_marcador
  for each row execute function public.tg_mesmo_espaco();
create trigger analises_espaco_imutavel before update on public.analises
  for each row execute function public.tg_espaco_imutavel();
create trigger resultados_espaco_imutavel before update on public.resultados
  for each row execute function public.tg_espaco_imutavel();
create trigger alvos_espaco_imutavel before update on public.alvos_marcador
  for each row execute function public.tg_espaco_imutavel();

-- O resultado tem de pertencer à mesma análise/utente.
create or replace function public.tg_resultado_coerente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.analises a
                 where a.id = new.analise_id and a.utente_id = new.utente_id and a.espaco_id = new.espaco_id) then
    raise exception 'Resultado fora da análise';
  end if;
  return new;
end $$;
revoke execute on function public.tg_resultado_coerente() from public, anon, authenticated;
create trigger resultados_coerentes before insert or update on public.resultados
  for each row execute function public.tg_resultado_coerente();

-- Políticas (clínico que segue o utente; função criada na migração da medicação).
create policy analises_ler on public.analises for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy analises_criar on public.analises for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy analises_alterar on public.analises for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));

create policy resultados_ler on public.resultados for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy resultados_criar on public.resultados for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy resultados_alterar on public.resultados for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));

create policy alvos_ler on public.alvos_marcador for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy alvos_criar on public.alvos_marcador for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy alvos_alterar on public.alvos_marcador for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));
-- Sem DELETE nas três tabelas.

-- Autor e data de criação fixos, data de alteração atualizada, auditoria (funções da migração da medicação).
create trigger analises_alterado before update on public.analises
  for each row execute function public.tg_registo_clinico_alterado();
create trigger resultados_alterado before update on public.resultados
  for each row execute function public.tg_registo_clinico_alterado();
create trigger alvos_alterado before update on public.alvos_marcador
  for each row execute function public.tg_registo_clinico_alterado();
create trigger analises_auditar after insert or update on public.analises
  for each row execute function public.tg_auditar_registo_clinico();
create trigger resultados_auditar after insert or update on public.resultados
  for each row execute function public.tg_auditar_registo_clinico();
create trigger alvos_auditar after insert or update on public.alvos_marcador
  for each row execute function public.tg_auditar_registo_clinico();

-- Relatórios (PDF/imagens) num bucket privado: <espaco>/<utente>/<uuid>-<nome>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('analises', 'analises', false, 20971520,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create or replace function public.ficheiro_clinico_permitido(p_nome text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.utentes u
    where u.espaco_id::text = (storage.foldername(p_nome))[1]
      and u.id::text = (storage.foldername(p_nome))[2]
      and public.clinico_que_segue(u.espaco_id, u.id))
$$;
revoke execute on function public.ficheiro_clinico_permitido(text) from public, anon;

create policy analises_ficheiros_ler on storage.objects for select to authenticated
  using (bucket_id = 'analises' and public.ficheiro_clinico_permitido(name));
create policy analises_ficheiros_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'analises' and public.ficheiro_clinico_permitido(name));
