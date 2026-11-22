-- Lembretes de consulta por email e exames pedidos (para as pendências da ficha).

-- Lembretes: desligados por omissão em cada espaço (a administração liga-os nas Definições);
-- cada utente pode ser excluído individualmente.
alter table public.espacos add column if not exists lembretes_email boolean not null default false;
alter table public.utentes add column if not exists lembretes_email boolean not null default true;
alter table public.consultas add column if not exists lembrete_enviado_em timestamptz;

-- Consultas a lembrar num intervalo de tempo. Só para o servidor (service role): devolve o mínimo
-- para o email (sem dados de saúde).
create or replace function public.consultas_para_lembrete(p_de timestamptz, p_ate timestamptz)
returns table (
  consulta_id uuid,
  inicio timestamptz,
  tipo text,
  email text,
  utente_nome text,
  espaco_nome text,
  profissional_nome text
) language sql stable security definer set search_path = public as $$
  select c.id, c.inicio, c.tipo, u.email, u.nome, e.nome, m.nome_exibicao
  from public.consultas c
  join public.utentes u on u.id = c.utente_id
  join public.espacos e on e.id = c.espaco_id
  join public.membros m on m.id = c.profissional_id
  where c.estado = 'agendada'
    and c.lembrete_enviado_em is null
    and c.inicio >= p_de and c.inicio < p_ate
    and e.lembretes_email
    and u.lembretes_email
    and u.email is not null and u.email ~ '^\S+@\S+\.\S+$'
$$;

create or replace function public.marcar_lembrete_enviado(p_consulta uuid)
returns void language sql security definer set search_path = public as $$
  update public.consultas set lembrete_enviado_em = now() where id = p_consulta
$$;

revoke execute on function public.consultas_para_lembrete(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.marcar_lembrete_enviado(uuid) from public, anon, authenticated;

-- Se a consulta muda de hora, o lembrete volta a poder ser enviado.
create or replace function public.tg_consulta_reagendada()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.inicio is distinct from old.inicio then
    new.lembrete_enviado_em := null;
  end if;
  return new;
end $$;
revoke execute on function public.tg_consulta_reagendada() from public, anon, authenticated;
create trigger consultas_reagendada before update on public.consultas
  for each row execute function public.tg_consulta_reagendada();

-- Exames pedidos: o que foi pedido ao utente e ainda não tem resultado.
create table public.pedidos_exame (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  utente_id uuid not null references public.utentes(id) on delete cascade,
  autor_id uuid not null references public.membros(id),
  descricao text not null check (length(trim(descricao)) between 1 and 300),
  pedido_em date not null default current_date,
  prazo date,
  estado text not null default 'pendente' check (estado in ('pendente', 'recebido', 'cancelado')),
  analise_id uuid references public.analises(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (prazo is null or prazo >= pedido_em)
);
create index on public.pedidos_exame (utente_id, estado);

alter table public.pedidos_exame enable row level security;

create trigger pedidos_exame_mesmo_espaco before insert or update on public.pedidos_exame
  for each row execute function public.tg_mesmo_espaco();
create trigger pedidos_exame_espaco_imutavel before update on public.pedidos_exame
  for each row execute function public.tg_espaco_imutavel();
create trigger pedidos_exame_alterado before update on public.pedidos_exame
  for each row execute function public.tg_registo_clinico_alterado();
create trigger pedidos_exame_auditar after insert or update on public.pedidos_exame
  for each row execute function public.tg_auditar_registo_clinico();

create policy pedidos_exame_ler on public.pedidos_exame for select to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id));
create policy pedidos_exame_criar on public.pedidos_exame for insert to authenticated
  with check (public.clinico_que_segue(espaco_id, utente_id) and autor_id = (public.meu_membro(espaco_id)).id);
create policy pedidos_exame_alterar on public.pedidos_exame for update to authenticated
  using (public.clinico_que_segue(espaco_id, utente_id))
  with check (public.clinico_que_segue(espaco_id, utente_id));
-- Sem DELETE: um pedido feito por engano cancela-se.
