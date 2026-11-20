-- Teste das regras de acesso da Fase 3. Corre como superutilizador; cria dados com o prefixo
-- "teste-rls-", devolve uma linha por verificação e apaga tudo no fim.
-- Uso: executar o ficheiro inteiro; todas as linhas devem ter ok = true.

create or replace function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.contar(p_user uuid, p_sql text) returns int language plpgsql as $$
declare n int;
begin
  perform pg_temp.como(p_user);
  execute p_sql into n;
  execute 'reset role';
  return n;
end $$;

-- Executa como utilizador; devolve 'ok' ou a mensagem de erro.
create or replace function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $$
begin
  perform pg_temp.como(p_user);
  begin
    execute p_sql;
  exception when others then
    execute 'reset role';
    return 'erro: ' || sqlerrm;
  end;
  execute 'reset role';
  return 'ok';
end $$;

create or replace function pg_temp.testes() returns table (teste text, esperado text, obtido text, ok boolean)
language plpgsql as $$
declare
  u_dona uuid := gen_random_uuid(); u_manager uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid();
  u_nutri uuid := gen_random_uuid(); u_psi uuid := gen_random_uuid(); u_admin uuid := gen_random_uuid();
  u_fora uuid := gen_random_uuid();
  c uuid; c2 uuid; m_dona uuid; m_manager uuid; m_medico uuid; m_nutri uuid; m_psi uuid; m_admin uuid;
  ut uuid; d1 uuid; d2 uuid; d3 uuid; d4 uuid; o1 uuid; o2 uuid; pedido uuid; r text;
begin
  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-rls-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_manager, 'manager'), (u_medico, 'medico'), (u_nutri, 'nutri'),
               (u_psi, 'psi'), (u_admin, 'admin'), (u_fora, 'fora')) as x(id, n);

  -- A dona cria a clínica (via função, como ela própria).
  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-rls-clinica', 'Dona', 'administrativo');
  m_manager := public.convidar_membro(c, 'teste-rls-manager@vivara.invalid', 'Manager', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-rls-medico@vivara.invalid', 'Médico', 'medico');
  m_nutri := public.convidar_membro(c, 'teste-rls-nutri@vivara.invalid', 'Nutricionista', 'profissional', 'Nutricionista');
  m_psi := public.convidar_membro(c, 'teste-rls-psi@vivara.invalid', 'Psicólogo', 'profissional', 'Psicólogo');
  m_admin := public.convidar_membro(c, 'teste-rls-admin@vivara.invalid', 'Administrativa', 'administrativo');
  perform public.definir_manager(m_manager, true);
  execute 'reset role';
  select id into m_dona from public.membros where espaco_id = c and user_id = u_dona;

  -- Outra clínica, de outra pessoa.
  perform pg_temp.como(u_fora);
  c2 := public.criar_espaco('individual', 'teste-rls-individual', 'Fora', 'medico');
  execute 'reset role';

  -- Dados (como superutilizador): a administrativa cria o utente e marca consultas com médico e nutricionista.
  insert into public.utentes (espaco_id, nome, criado_por) values (c, 'teste-rls-utente', m_admin) returning id into ut;
  insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, criado_por)
  values (c, ut, m_medico, now() + interval '1 day', m_admin), (c, ut, m_nutri, now() + interval '2 days', m_admin);
  insert into public.registos_clinicos (espaco_id, utente_id, tipo, autor_id) values (c, ut, 'anamnese', m_medico);
  insert into public.diarios (espaco_id, utente_id, autor_id, texto, visibilidade) values (c, ut, m_medico, 'D1 público', 'publico') returning id into d1;
  insert into public.diarios (espaco_id, utente_id, autor_id, texto, visibilidade) values (c, ut, m_medico, 'D2 privado → nutri', 'privado') returning id into d2;
  insert into public.diarios (espaco_id, utente_id, autor_id, texto, visibilidade) values (c, ut, m_medico, 'D3 privado → psi', 'privado') returning id into d3;
  insert into public.diarios (espaco_id, utente_id, autor_id, texto, visibilidade) values (c, ut, m_medico, 'D4 privado → dona', 'privado') returning id into d4;
  insert into public.diario_partilhas values (d2, m_nutri), (d3, m_psi), (d4, m_dona);
  insert into public.observacoes (espaco_id, utente_id, autor_id, texto) values (c, ut, m_admin, 'O1 pública') returning id into o1;
  insert into public.observacoes (espaco_id, utente_id, autor_id, texto, visibilidade) values (c, ut, m_admin, 'O2 privada → psi', 'privado') returning id into o2;
  insert into public.observacao_partilhas values (o2, m_psi);

  -- Diários visíveis
  return query select 'médico (autor) vê diários', '4', pg_temp.contar(u_medico, 'select count(*) from public.diarios')::text, null::boolean;
  return query select 'nutricionista (segue) vê D1 + D2', '2', pg_temp.contar(u_nutri, 'select count(*) from public.diarios')::text, null;
  return query select 'psicólogo (não segue) não vê nenhum, mesmo partilhado', '0', pg_temp.contar(u_psi, 'select count(*) from public.diarios')::text, null;
  return query select 'administrativa nunca vê diários', '0', pg_temp.contar(u_admin, 'select count(*) from public.diarios')::text, null;
  return query select 'dona vê público + o partilhado com ela', '2', pg_temp.contar(u_dona, 'select count(*) from public.diarios')::text, null;
  return query select 'manager vê só o público', '1', pg_temp.contar(u_manager, 'select count(*) from public.diarios')::text, null;

  -- Ficha clínica
  return query select 'médico vê ficha clínica', '1', pg_temp.contar(u_medico, 'select count(*) from public.registos_clinicos')::text, null;
  return query select 'nutricionista vê ficha clínica', '1', pg_temp.contar(u_nutri, 'select count(*) from public.registos_clinicos')::text, null;
  return query select 'psicólogo não vê ficha clínica', '0', pg_temp.contar(u_psi, 'select count(*) from public.registos_clinicos')::text, null;
  return query select 'administrativa não vê ficha clínica', '0', pg_temp.contar(u_admin, 'select count(*) from public.registos_clinicos')::text, null;
  return query select 'dona não vê ficha clínica', '0', pg_temp.contar(u_dona, 'select count(*) from public.registos_clinicos')::text, null;

  -- Observações
  return query select 'médico vê só a observação pública', '1', pg_temp.contar(u_medico, 'select count(*) from public.observacoes')::text, null;
  return query select 'psicólogo vê pública + privada (sem seguir)', '2', pg_temp.contar(u_psi, 'select count(*) from public.observacoes')::text, null;
  return query select 'administrativa (autora) vê as duas', '2', pg_temp.contar(u_admin, 'select count(*) from public.observacoes')::text, null;

  -- Dados administrativos e isolamento entre espaços
  return query select 'administrativa vê o utente', '1', pg_temp.contar(u_admin, 'select count(*) from public.utentes')::text, null;
  return query select 'membro de outro espaço não vê o utente', '0', pg_temp.contar(u_fora, 'select count(*) from public.utentes')::text, null;
  return query select 'membro de outro espaço não vê diários', '0', pg_temp.contar(u_fora, 'select count(*) from public.diarios')::text, null;

  -- Partilha só com quem pode ver
  r := pg_temp.tentar(u_medico, format('insert into public.diario_partilhas values (%L, %L)', d2, m_admin));
  return query select 'partilhar diário com administrativa é recusado', 'erro', split_part(r, ':', 1), null;
  r := pg_temp.tentar(u_nutri, format('insert into public.diario_partilhas values (%L, %L)', d1, m_nutri));
  return query select 'só o autor gere partilhas', 'erro', split_part(r, ':', 1), null;

  -- Escrita de diários
  r := pg_temp.tentar(u_psi, format('insert into public.diarios (espaco_id, utente_id, autor_id, texto) values (%L, %L, %L, %L)', c, ut, m_psi, 'x'));
  return query select 'psicólogo não escreve diário de utente que não segue', 'erro', split_part(r, ':', 1), null;
  r := pg_temp.tentar(u_nutri, format('update public.diarios set texto = %L where id = %L', 'alterado', d1));
  return query select 'nutricionista não altera diário de outro (0 linhas)', '0',
    pg_temp.contar(u_medico, format('select count(*) from public.diarios where id = %L and texto = %L', d1, 'alterado'))::text, null;

  -- Psicólogo passa a seguir quando tem consulta marcada
  insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, criado_por) values (c, ut, m_psi, now() + interval '3 days', m_admin);
  return query select 'psicólogo com consulta vê D1 + D3', '2', pg_temp.contar(u_psi, 'select count(*) from public.diarios')::text, null;
  return query select 'psicólogo com consulta vê ficha clínica', '1', pg_temp.contar(u_psi, 'select count(*) from public.registos_clinicos')::text, null;

  -- Bloqueio
  r := pg_temp.tentar(u_admin, format('select public.definir_estado_membro(%L, %L)', m_nutri, 'bloqueado'));
  return query select 'administrativa não bloqueia membros', 'erro', split_part(r, ':', 1), null;
  r := pg_temp.tentar(u_manager, format('select public.definir_estado_membro(%L, %L)', m_nutri, 'bloqueado'));
  return query select 'manager bloqueia', 'ok', r, null;
  return query select 'membro bloqueado não vê utentes', '0', pg_temp.contar(u_nutri, 'select count(*) from public.utentes')::text, null;
  r := pg_temp.tentar(u_manager, format('select public.definir_estado_membro(%L, %L)', m_dona, 'bloqueado'));
  return query select 'ninguém bloqueia a dona', 'erro', split_part(r, ':', 1), null;

  -- Managers
  r := pg_temp.tentar(u_manager, format('select public.definir_manager(%L, true)', m_admin));
  return query select 'manager não nomeia managers', 'erro', split_part(r, ':', 1), null;

  -- Exportação com aprovação
  perform pg_temp.como(u_medico);
  pedido := public.pedir_exportacao(c, 'utente', ut, 'Mudança de clínica');
  execute 'reset role';
  return query select 'pedido de exportação na clínica fica pendente', 'pendente', (select estado from public.pedidos_exportacao where id = pedido), null;
  r := pg_temp.tentar(u_medico, format('select public.usar_exportacao(%L)', pedido));
  return query select 'não exporta sem aprovação', 'erro', split_part(r, ':', 1), null;
  r := pg_temp.tentar(u_admin, format('select public.decidir_exportacao(%L, true)', pedido));
  return query select 'administrativa não aprova', 'erro', split_part(r, ':', 1), null;
  r := pg_temp.tentar(u_manager, format('select public.decidir_exportacao(%L, true)', pedido));
  return query select 'manager aprova', 'ok', r, null;
  r := pg_temp.tentar(u_medico, format('select public.usar_exportacao(%L)', pedido));
  return query select 'médico exporta depois de aprovado', 'ok', r, null;
  r := pg_temp.tentar(u_medico, format('select public.usar_exportacao(%L)', pedido));
  return query select 'autorização só serve uma vez', 'erro', split_part(r, ':', 1), null;

  perform pg_temp.como(u_fora);
  pedido := public.pedir_exportacao(c2, 'tudo');
  execute 'reset role';
  return query select 'Plano Médico: exportação aprovada logo', 'aprovado', (select estado from public.pedidos_exportacao where id = pedido), null;

  -- Chat interno
  r := pg_temp.tentar(u_admin, format('insert into public.canal_mensagens (espaco_id, autor_id, para_id, texto) values (%L, %L, %L, %L)', c, m_admin, m_medico, 'O utente chegou'));
  return query select 'administrativa envia mensagem ao médico', 'ok', r, null;
  return query select 'médico vê a mensagem', '1', pg_temp.contar(u_medico, 'select count(*) from public.canal_mensagens')::text, null;
  return query select 'psicólogo não vê mensagem privada', '0', pg_temp.contar(u_psi, 'select count(*) from public.canal_mensagens')::text, null;
  r := pg_temp.tentar(u_fora, format('insert into public.canal_mensagens (espaco_id, autor_id, texto) values (%L, %L, %L)', c, m_admin, 'intruso'));
  return query select 'quem não é membro não escreve no canal', 'erro', split_part(r, ':', 1), null;

  -- Limpeza
  delete from public.espacos where nome like 'teste-rls-%';
  delete from auth.users where email like 'teste-rls-%@vivara.invalid';
end $$;

select teste, esperado, obtido, esperado = obtido as ok from pg_temp.testes();
