-- Fase 3: espaços de trabalho (clínica / médico individual), membros, utentes,
-- seguimentos, consultas, diários, observações, exportações, chat interno e auditoria.
-- Regras de acesso aplicadas por RLS.

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.espacos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('clinica', 'individual')),
  nome text not null check (length(trim(nome)) between 1 and 200),
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now()
);

-- funcao: o que a pessoa faz. papel_admin: poderes de gestão (dona/manager), independente da função.
create table public.membros (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_exibicao text not null,
  funcao text not null check (funcao in ('medico', 'profissional', 'administrativo')),
  profissao text,
  papel_admin text check (papel_admin in ('dona', 'manager')),
  estado text not null default 'ativo' check (estado in ('ativo', 'bloqueado')),
  criado_em timestamptz not null default now(),
  unique (espaco_id, user_id),
  check (funcao <> 'profissional' or (profissao is not null and length(trim(profissao)) > 0))
);
create unique index membros_uma_dona on public.membros (espaco_id) where papel_admin = 'dona';

create table public.utentes (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 200),
  data_nascimento date,
  sexo text check (sexo in ('F', 'M')),
  email text,
  telefone text,
  cidade text,
  clinica_onde_visto text,
  chat_estado text not null default 'desativado' check (chat_estado in ('desativado', 'ativo', 'bloqueado')),
  criado_por uuid references public.membros(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.utentes (espaco_id);

-- Quem segue o utente (só profissionais de saúde). Dá acesso à ficha clínica, presente e passado.
create table public.seguimentos (
  utente_id uuid not null references public.utentes(id) on delete cascade,
  membro_id uuid not null references public.membros(id) on delete cascade,
  origem text not null check (origem in ('criador', 'consulta', 'manual')),
  desde timestamptz not null default now(),
  primary key (utente_id, membro_id)
);
create index on public.seguimentos (membro_id);

create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  profissional_id uuid not null references public.membros(id),
  inicio timestamptz not null,
  duracao_min int not null default 30 check (duracao_min between 5 and 480),
  tipo text not null default 'presencial' check (tipo in ('presencial', 'video')),
  estado text not null default 'agendada' check (estado in ('agendada', 'realizada', 'cancelada', 'falta')),
  motivo text,
  criado_por uuid references public.membros(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.consultas (espaco_id, inicio);
create index on public.consultas (utente_id);

-- Dados clínicos (marcadores, anamnese, plano, documentos...). Só para quem segue o utente.
create table public.registos_clinicos (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  tipo text not null,
  dados jsonb not null default '{}'::jsonb,
  autor_id uuid references public.membros(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.registos_clinicos (utente_id);

create table public.diarios (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  consulta_id uuid references public.consultas(id) on delete set null,
  autor_id uuid not null references public.membros(id),
  texto text not null,
  visibilidade text not null default 'publico' check (visibilidade in ('publico', 'privado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.diarios (utente_id, criado_em desc);

create table public.diario_partilhas (
  diario_id uuid not null references public.diarios(id) on delete cascade,
  membro_id uuid not null references public.membros(id) on delete cascade,
  primary key (diario_id, membro_id)
);

create table public.observacoes (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  consulta_id uuid references public.consultas(id) on delete set null,
  autor_id uuid not null references public.membros(id),
  texto text not null,
  visibilidade text not null default 'publico' check (visibilidade in ('publico', 'privado')),
  criado_em timestamptz not null default now()
);
create index on public.observacoes (utente_id, criado_em desc);

create table public.observacao_partilhas (
  observacao_id uuid not null references public.observacoes(id) on delete cascade,
  membro_id uuid not null references public.membros(id) on delete cascade,
  primary key (observacao_id, membro_id)
);

create table public.pedidos_exportacao (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  requerente_id uuid not null references public.membros(id),
  ambito text not null check (ambito in ('utente', 'tudo')),
  utente_id uuid references public.utentes(id) on delete cascade,
  motivo text,
  estado text not null default 'pendente' check (estado in ('pendente', 'aprovado', 'recusado', 'usado')),
  decidido_por uuid references public.membros(id),
  decidido_em timestamptz,
  expira_em timestamptz,
  usado_em timestamptz,
  criado_em timestamptz not null default now(),
  check (ambito <> 'utente' or utente_id is not null)
);
create index on public.pedidos_exportacao (espaco_id, estado);

-- Chat interno da clínica (só texto). para_id nulo = canal geral.
create table public.canal_mensagens (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  para_id uuid references public.membros(id),
  texto text not null check (length(texto) between 1 and 4000),
  criado_em timestamptz not null default now()
);
create index on public.canal_mensagens (espaco_id, criado_em desc);

create table public.auditoria (
  id bigint generated always as identity primary key,
  espaco_id uuid references public.espacos(id) on delete cascade,
  user_id uuid,
  acao text not null,
  alvo text,
  detalhe jsonb,
  criado_em timestamptz not null default now()
);
create index on public.auditoria (espaco_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer para evitar recursão de RLS)
-- ---------------------------------------------------------------------------

create or replace function public.meu_membro(p_espaco uuid)
returns public.membros language sql stable security definer set search_path = public as $$
  select m.* from public.membros m
  where m.espaco_id = p_espaco and m.user_id = auth.uid() and m.estado = 'ativo'
$$;

create or replace function public.e_membro(p_espaco uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m
    where m.espaco_id = p_espaco and m.user_id = auth.uid() and m.estado = 'ativo')
$$;

create or replace function public.e_admin(p_espaco uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m
    where m.espaco_id = p_espaco and m.user_id = auth.uid() and m.estado = 'ativo'
      and m.papel_admin is not null)
$$;

create or replace function public.e_clinico(p_espaco uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m
    where m.espaco_id = p_espaco and m.user_id = auth.uid() and m.estado = 'ativo'
      and m.funcao in ('medico', 'profissional'))
$$;

-- O utilizador atual é profissional de saúde ativo e segue o utente.
create or replace function public.segue_utente(p_utente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.seguimentos s
    join public.membros m on m.id = s.membro_id
    where s.utente_id = p_utente and m.user_id = auth.uid() and m.estado = 'ativo'
      and m.funcao in ('medico', 'profissional'))
$$;

-- Um membro (não o utilizador atual) pode ver conteúdo clínico privado deste utente.
create or replace function public.membro_elegivel_diario(p_membro uuid, p_utente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m
    where m.id = p_membro and m.estado = 'ativo'
      and (m.papel_admin is not null
           or (m.funcao in ('medico', 'profissional')
               and exists (select 1 from public.seguimentos s where s.utente_id = p_utente and s.membro_id = m.id))))
$$;

create or replace function public.pode_ver_diario(p_diario uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.diarios d
    join public.membros eu on eu.espaco_id = d.espaco_id and eu.user_id = auth.uid() and eu.estado = 'ativo'
    where d.id = p_diario and (
      d.autor_id = eu.id
      or (d.visibilidade = 'publico' and (
            eu.papel_admin is not null
            or (eu.funcao in ('medico', 'profissional') and public.segue_utente(d.utente_id))))
      or (d.visibilidade = 'privado'
          and exists (select 1 from public.diario_partilhas p where p.diario_id = d.id and p.membro_id = eu.id)
          and (eu.papel_admin is not null
               or (eu.funcao in ('medico', 'profissional') and public.segue_utente(d.utente_id))))
    ))
$$;

create or replace function public.pode_ver_observacao(p_obs uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.observacoes o
    join public.membros eu on eu.espaco_id = o.espaco_id and eu.user_id = auth.uid() and eu.estado = 'ativo'
    where o.id = p_obs and (
      o.autor_id = eu.id
      or o.visibilidade = 'publico'
      or exists (select 1 from public.observacao_partilhas p where p.observacao_id = o.id and p.membro_id = eu.id)
    ))
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Quem cria o utente, se for profissional de saúde, passa a segui-lo.
create or replace function public.tg_utente_criador_segue()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.criado_por is not null and exists (
    select 1 from public.membros m where m.id = new.criado_por and m.funcao in ('medico', 'profissional')) then
    insert into public.seguimentos (utente_id, membro_id, origem)
    values (new.id, new.criado_por, 'criador') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger utente_criador_segue after insert on public.utentes
  for each row execute function public.tg_utente_criador_segue();

-- Consulta marcada com um profissional → passa a seguir o utente.
create or replace function public.tg_consulta_segue()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.membros m where m.id = new.profissional_id
             and m.espaco_id = new.espaco_id and m.funcao in ('medico', 'profissional')) then
    insert into public.seguimentos (utente_id, membro_id, origem)
    values (new.utente_id, new.profissional_id, 'consulta') on conflict do nothing;
  else
    raise exception 'A consulta tem de ser com um profissional de saúde deste espaço';
  end if;
  return new;
end $$;
create trigger consulta_segue after insert or update of profissional_id on public.consultas
  for each row execute function public.tg_consulta_segue();

-- Coerência: utente/consulta/autor no mesmo espaço.
create or replace function public.tg_mesmo_espaco()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.utentes u where u.id = new.utente_id and u.espaco_id = new.espaco_id) then
    raise exception 'Utente fora do espaço';
  end if;
  return new;
end $$;
create trigger diarios_mesmo_espaco before insert or update on public.diarios
  for each row execute function public.tg_mesmo_espaco();
create trigger observacoes_mesmo_espaco before insert or update on public.observacoes
  for each row execute function public.tg_mesmo_espaco();
create trigger consultas_mesmo_espaco before insert or update on public.consultas
  for each row execute function public.tg_mesmo_espaco();
create trigger registos_mesmo_espaco before insert or update on public.registos_clinicos
  for each row execute function public.tg_mesmo_espaco();

-- Um registo nunca muda de espaço.
create or replace function public.tg_espaco_imutavel()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.espaco_id <> old.espaco_id then raise exception 'Não é possível mudar de espaço'; end if;
  return new;
end $$;
create trigger utentes_espaco_imutavel before update on public.utentes
  for each row execute function public.tg_espaco_imutavel();
create trigger consultas_espaco_imutavel before update on public.consultas
  for each row execute function public.tg_espaco_imutavel();
create trigger registos_espaco_imutavel before update on public.registos_clinicos
  for each row execute function public.tg_espaco_imutavel();
create trigger diarios_espaco_imutavel before update on public.diarios
  for each row execute function public.tg_espaco_imutavel();
create trigger observacoes_espaco_imutavel before update on public.observacoes
  for each row execute function public.tg_espaco_imutavel();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.espacos enable row level security;
alter table public.membros enable row level security;
alter table public.utentes enable row level security;
alter table public.seguimentos enable row level security;
alter table public.consultas enable row level security;
alter table public.registos_clinicos enable row level security;
alter table public.diarios enable row level security;
alter table public.diario_partilhas enable row level security;
alter table public.observacoes enable row level security;
alter table public.observacao_partilhas enable row level security;
alter table public.pedidos_exportacao enable row level security;
alter table public.canal_mensagens enable row level security;
alter table public.auditoria enable row level security;

create policy espacos_ler on public.espacos for select to authenticated using (public.e_membro(id));
create policy espacos_editar on public.espacos for update to authenticated
  using (public.e_admin(id)) with check (public.e_admin(id));

-- Membros: escrita só através das funções (convidar_membro, definir_*).
create policy membros_ler on public.membros for select to authenticated
  using (user_id = auth.uid() or public.e_membro(espaco_id));

create policy utentes_ler on public.utentes for select to authenticated using (public.e_membro(espaco_id));
create policy utentes_criar on public.utentes for insert to authenticated
  with check (public.e_membro(espaco_id) and criado_por = (public.meu_membro(espaco_id)).id);
create policy utentes_editar on public.utentes for update to authenticated
  using (public.e_membro(espaco_id)) with check (public.e_membro(espaco_id));
create policy utentes_apagar on public.utentes for delete to authenticated using (public.e_admin(espaco_id));

create policy seguimentos_ler on public.seguimentos for select to authenticated
  using (exists (select 1 from public.utentes u where u.id = utente_id and public.e_membro(u.espaco_id)));

create policy consultas_ler on public.consultas for select to authenticated using (public.e_membro(espaco_id));
create policy consultas_criar on public.consultas for insert to authenticated
  with check (public.e_membro(espaco_id) and criado_por = (public.meu_membro(espaco_id)).id);
create policy consultas_editar on public.consultas for update to authenticated
  using (public.e_membro(espaco_id)) with check (public.e_membro(espaco_id));
create policy consultas_apagar on public.consultas for delete to authenticated using (public.e_membro(espaco_id));

create policy registos_ler on public.registos_clinicos for select to authenticated
  using (public.segue_utente(utente_id));
create policy registos_criar on public.registos_clinicos for insert to authenticated
  with check (public.segue_utente(utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy registos_editar on public.registos_clinicos for update to authenticated
  using (public.segue_utente(utente_id)) with check (public.segue_utente(utente_id));

create policy diarios_ler on public.diarios for select to authenticated using (public.pode_ver_diario(id));
create policy diarios_criar on public.diarios for insert to authenticated
  with check (public.segue_utente(utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy diarios_editar on public.diarios for update to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id)
  with check (autor_id = (public.meu_membro(espaco_id)).id and public.segue_utente(utente_id));
create policy diarios_apagar on public.diarios for delete to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id);

create policy diario_partilhas_ler on public.diario_partilhas for select to authenticated
  using (public.pode_ver_diario(diario_id));
create policy diario_partilhas_gerir on public.diario_partilhas for all to authenticated
  using (exists (select 1 from public.diarios d where d.id = diario_id and d.autor_id = (public.meu_membro(d.espaco_id)).id))
  with check (exists (select 1 from public.diarios d where d.id = diario_id
                      and d.autor_id = (public.meu_membro(d.espaco_id)).id
                      and public.membro_elegivel_diario(membro_id, d.utente_id)));

create policy observacoes_ler on public.observacoes for select to authenticated using (public.pode_ver_observacao(id));
create policy observacoes_criar on public.observacoes for insert to authenticated
  with check (autor_id = (public.meu_membro(espaco_id)).id);
create policy observacoes_editar on public.observacoes for update to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id)
  with check (autor_id = (public.meu_membro(espaco_id)).id);
create policy observacoes_apagar on public.observacoes for delete to authenticated
  using (autor_id = (public.meu_membro(espaco_id)).id);

create policy observacao_partilhas_ler on public.observacao_partilhas for select to authenticated
  using (public.pode_ver_observacao(observacao_id));
create policy observacao_partilhas_gerir on public.observacao_partilhas for all to authenticated
  using (exists (select 1 from public.observacoes o where o.id = observacao_id and o.autor_id = (public.meu_membro(o.espaco_id)).id))
  with check (exists (select 1 from public.observacoes o join public.membros m on m.id = membro_id
                      where o.id = observacao_id and m.espaco_id = o.espaco_id
                        and o.autor_id = (public.meu_membro(o.espaco_id)).id));

-- Pedidos: o requerente e a administração veem; decisão só pelas funções.
create policy pedidos_ler on public.pedidos_exportacao for select to authenticated
  using (requerente_id = (public.meu_membro(espaco_id)).id or public.e_admin(espaco_id));

create policy canal_ler on public.canal_mensagens for select to authenticated
  using (public.e_membro(espaco_id) and (para_id is null
    or para_id = (public.meu_membro(espaco_id)).id or autor_id = (public.meu_membro(espaco_id)).id));
create policy canal_enviar on public.canal_mensagens for insert to authenticated
  with check (autor_id = (public.meu_membro(espaco_id)).id
    and (para_id is null or exists (select 1 from public.membros m
         where m.id = canal_mensagens.para_id and m.espaco_id = canal_mensagens.espaco_id)));

create policy auditoria_ler on public.auditoria for select to authenticated using (public.e_admin(espaco_id));

-- ---------------------------------------------------------------------------
-- Funções de negócio
-- ---------------------------------------------------------------------------

create or replace function public.auditar(p_espaco uuid, p_acao text, p_alvo text, p_detalhe jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.auditoria (espaco_id, user_id, acao, alvo, detalhe) values (p_espaco, auth.uid(), p_acao, p_alvo, p_detalhe)
$$;
revoke execute on function public.auditar(uuid, text, text, jsonb) from public, anon, authenticated;

-- Cria um espaço; quem cria fica dona (clínica) ou titular (individual).
create or replace function public.criar_espaco(p_tipo text, p_nome text, p_nome_exibicao text, p_funcao text, p_profissao text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_espaco uuid;
begin
  if auth.uid() is null then raise exception 'Sem sessão'; end if;
  if p_tipo = 'individual' and p_funcao <> 'medico' then raise exception 'O Plano Médico é para médicos'; end if;
  insert into public.espacos (tipo, nome, criado_por) values (p_tipo, p_nome, auth.uid()) returning id into v_espaco;
  insert into public.membros (espaco_id, user_id, nome_exibicao, funcao, profissao, papel_admin)
  values (v_espaco, auth.uid(), p_nome_exibicao, p_funcao, p_profissao, 'dona');
  perform public.auditar(v_espaco, 'criar_espaco', p_tipo, null);
  return v_espaco;
end $$;

-- Adiciona um membro com conta existente (convites por email ficam para depois).
create or replace function public.convidar_membro(p_espaco uuid, p_email text, p_nome_exibicao text, p_funcao text, p_profissao text default null)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid; v_membro uuid; v_tipo text;
begin
  if not public.e_admin(p_espaco) then raise exception 'Sem permissão'; end if;
  select tipo into v_tipo from public.espacos where id = p_espaco;
  if v_tipo <> 'clinica' then raise exception 'Só clínicas têm equipa'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'Não existe conta com esse email'; end if;
  insert into public.membros (espaco_id, user_id, nome_exibicao, funcao, profissao)
  values (p_espaco, v_user, p_nome_exibicao, p_funcao, p_profissao) returning id into v_membro;
  perform public.auditar(p_espaco, 'convidar_membro', v_membro::text, jsonb_build_object('funcao', p_funcao));
  return v_membro;
end $$;

create or replace function public.definir_estado_membro(p_membro uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v public.membros;
begin
  select * into v from public.membros where id = p_membro;
  if v.id is null or not public.e_admin(v.espaco_id) then raise exception 'Sem permissão'; end if;
  if v.papel_admin = 'dona' then raise exception 'Não é possível bloquear a dona'; end if;
  if v.papel_admin = 'manager' and (public.meu_membro(v.espaco_id)).papel_admin <> 'dona' then
    raise exception 'Só a dona pode bloquear managers';
  end if;
  update public.membros set estado = p_estado where id = p_membro;
  perform public.auditar(v.espaco_id, 'estado_membro', p_membro::text, jsonb_build_object('estado', p_estado));
end $$;

-- Só a dona nomeia ou retira managers.
create or replace function public.definir_manager(p_membro uuid, p_manager boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v public.membros;
begin
  select * into v from public.membros where id = p_membro;
  if v.id is null or (public.meu_membro(v.espaco_id)).papel_admin is distinct from 'dona' then
    raise exception 'Só a dona pode nomear managers';
  end if;
  if v.papel_admin = 'dona' then raise exception 'A dona não muda de papel'; end if;
  update public.membros set papel_admin = case when p_manager then 'manager' end where id = p_membro;
  perform public.auditar(v.espaco_id, 'definir_manager', p_membro::text, jsonb_build_object('manager', p_manager));
end $$;

-- Pedido de exportação. No Plano Médico fica aprovado de imediato.
create or replace function public.pedir_exportacao(p_espaco uuid, p_ambito text, p_utente uuid default null, p_motivo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_eu public.membros; v_tipo text; v_id uuid;
begin
  v_eu := public.meu_membro(p_espaco);
  if v_eu.id is null or v_eu.funcao not in ('medico', 'profissional') then raise exception 'Sem permissão'; end if;
  if p_ambito = 'utente' and not public.segue_utente(p_utente) then raise exception 'Não segue este utente'; end if;
  select tipo into v_tipo from public.espacos where id = p_espaco;
  insert into public.pedidos_exportacao (espaco_id, requerente_id, ambito, utente_id, motivo, estado, decidido_em, expira_em)
  values (p_espaco, v_eu.id, p_ambito, p_utente, p_motivo,
          case when v_tipo = 'individual' then 'aprovado' else 'pendente' end,
          case when v_tipo = 'individual' then now() end,
          case when v_tipo = 'individual' then now() + interval '7 days' end)
  returning id into v_id;
  perform public.auditar(p_espaco, 'pedir_exportacao', v_id::text, jsonb_build_object('ambito', p_ambito));
  return v_id;
end $$;

create or replace function public.decidir_exportacao(p_pedido uuid, p_aprovar boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v public.pedidos_exportacao;
begin
  select * into v from public.pedidos_exportacao where id = p_pedido;
  if v.id is null or not public.e_admin(v.espaco_id) then raise exception 'Sem permissão'; end if;
  if v.estado <> 'pendente' then raise exception 'Pedido já decidido'; end if;
  update public.pedidos_exportacao
     set estado = case when p_aprovar then 'aprovado' else 'recusado' end,
         decidido_por = (public.meu_membro(v.espaco_id)).id,
         decidido_em = now(),
         expira_em = case when p_aprovar then now() + interval '7 days' end
   where id = p_pedido;
  perform public.auditar(v.espaco_id, 'decidir_exportacao', p_pedido::text, jsonb_build_object('aprovado', p_aprovar));
end $$;

-- Usa uma autorização (uma vez, dentro do prazo).
create or replace function public.usar_exportacao(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.pedidos_exportacao;
begin
  select * into v from public.pedidos_exportacao where id = p_pedido for update;
  if v.id is null or v.requerente_id <> (public.meu_membro(v.espaco_id)).id then raise exception 'Sem permissão'; end if;
  if v.estado <> 'aprovado' or v.expira_em < now() then raise exception 'Exportação não autorizada ou expirada'; end if;
  update public.pedidos_exportacao set estado = 'usado', usado_em = now() where id = p_pedido;
  perform public.auditar(v.espaco_id, 'usar_exportacao', p_pedido::text, null);
end $$;

-- As funções auxiliares não precisam de ser chamadas por anónimos.
revoke execute on function public.meu_membro(uuid), public.e_membro(uuid), public.e_admin(uuid), public.e_clinico(uuid),
  public.segue_utente(uuid), public.membro_elegivel_diario(uuid, uuid), public.pode_ver_diario(uuid),
  public.pode_ver_observacao(uuid), public.criar_espaco(text, text, text, text, text),
  public.convidar_membro(uuid, text, text, text, text), public.definir_estado_membro(uuid, text),
  public.definir_manager(uuid, boolean), public.pedir_exportacao(uuid, text, uuid, text),
  public.decidir_exportacao(uuid, boolean), public.usar_exportacao(uuid)
  from public, anon;
