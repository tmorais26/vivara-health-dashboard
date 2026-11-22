-- As políticas de leitura de diários e observações voltavam a procurar o registo pelo id.
-- Num INSERT ... RETURNING o registo novo ainda não é visível para essa procura, e a escrita
-- falhava com 403. Passam a avaliar os campos da própria linha (mesmas regras de acesso).

create or replace function public.pode_ver_diario_linha(p_id uuid, p_espaco uuid, p_autor uuid, p_utente uuid, p_vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros eu
    where eu.espaco_id = p_espaco and eu.user_id = auth.uid() and eu.estado = 'ativo'
      and (
        eu.id = p_autor
        or (p_vis = 'publico' and (
              eu.papel_admin is not null
              or (eu.funcao in ('medico', 'profissional') and public.segue_utente(p_utente))))
        or (p_vis = 'privado'
            and exists (select 1 from public.diario_partilhas p where p.diario_id = p_id and p.membro_id = eu.id)
            and (eu.papel_admin is not null
                 or (eu.funcao in ('medico', 'profissional') and public.segue_utente(p_utente))))
      ))
$$;

create or replace function public.pode_ver_observacao_linha(p_id uuid, p_espaco uuid, p_autor uuid, p_vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros eu
    where eu.espaco_id = p_espaco and eu.user_id = auth.uid() and eu.estado = 'ativo'
      and (
        eu.id = p_autor
        or p_vis = 'publico'
        or exists (select 1 from public.observacao_partilhas p where p.observacao_id = p_id and p.membro_id = eu.id)
      ))
$$;

revoke execute on function public.pode_ver_diario_linha(uuid, uuid, uuid, uuid, text),
  public.pode_ver_observacao_linha(uuid, uuid, uuid, text) from public, anon;

drop policy diarios_ler on public.diarios;
create policy diarios_ler on public.diarios for select to authenticated
  using (public.pode_ver_diario_linha(id, espaco_id, autor_id, utente_id, visibilidade));

drop policy observacoes_ler on public.observacoes;
create policy observacoes_ler on public.observacoes for select to authenticated
  using (public.pode_ver_observacao_linha(id, espaco_id, autor_id, visibilidade));
