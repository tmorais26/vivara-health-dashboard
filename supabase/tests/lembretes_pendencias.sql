-- Teste de exames pedidos e lembretes de consulta.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_dona uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid(); u_admin uuid := gen_random_uuid();
  c uuid; m_medico uuid; m_admin uuid; ut uuid; con uuid; ped uuid; n int; out text := '';
begin
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  create function pg_temp.contar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin perform pg_temp.como(p_user); execute p_sql into n; execute 'reset role'; return n::text; end $f$;
  create function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin
    perform pg_temp.como(p_user);
    begin execute p_sql; get diagnostics n = row_count;
    exception when others then execute 'reset role'; return 'bloqueado'; end;
    execute 'reset role';
    return case when n = 0 then 'sem_efeito' else 'ok' end;
  end $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-lem-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_medico, 'medico'), (u_admin, 'admin')) as x(id, n);
  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-lem-clinica', 'Dona', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-lem-medico@vivara.invalid', 'Dr. Teste', 'medico');
  m_admin := public.convidar_membro(c, 'teste-lem-admin@vivara.invalid', 'Administrativa', 'administrativo');
  execute 'reset role';

  ut := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.utentes (id, espaco_id, nome, email, criado_por) values (%L,%L,%L,%L,%L)', ut, c, 'Joana Teste', 'joana@example.com', m_medico));

  ped := gen_random_uuid();
  out := out || pg_temp.chk('médico regista exame pedido', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.pedidos_exame (id, espaco_id, utente_id, autor_id, descricao) values (%L,%L,%L,%L,%L) returning id', ped, c, ut, m_medico, 'Hemograma')));
  out := out || pg_temp.chk('administrativa não vê exames pedidos', '0',
    pg_temp.contar(u_admin, format('select count(*) from public.pedidos_exame where utente_id = %L', ut)));
  out := out || pg_temp.chk('prazo antes do pedido é recusado', 'bloqueado', pg_temp.tentar(u_medico,
    format('insert into public.pedidos_exame (espaco_id, utente_id, autor_id, descricao, pedido_em, prazo) values (%L,%L,%L,%L,current_date,current_date-1)', c, ut, m_medico, 'X')));
  out := out || pg_temp.chk('marcar como recebido', 'ok', pg_temp.tentar(u_medico,
    format('update public.pedidos_exame set estado = %L where id = %L', 'recebido', ped)));
  out := out || pg_temp.chk('não se apaga', 'sem_efeito', pg_temp.tentar(u_medico,
    format('delete from public.pedidos_exame where id = %L', ped)));

  con := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.consultas (id, espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por) values (%L,%L,%L,%L,now() + interval %L,30,%L)', con, c, ut, m_medico, '1 day', m_medico));
  out := out || pg_temp.chk('utilizador não pode listar consultas para lembrete', 'bloqueado', pg_temp.tentar(u_medico,
    format('select * from public.consultas_para_lembrete(now(), now() + interval %L)', '2 days')));
  select count(*) into n from public.consultas_para_lembrete(now(), now() + interval '2 days') where consulta_id = con;
  out := out || pg_temp.chk('espaço sem lembretes ligados: não entra', '0', n::text);
  out := out || pg_temp.chk('administrativa não liga lembretes', 'sem_efeito', pg_temp.tentar(u_admin,
    format('update public.espacos set lembretes_email = true where id = %L', c)));
  out := out || pg_temp.chk('dona liga lembretes', 'ok', pg_temp.tentar(u_dona,
    format('update public.espacos set lembretes_email = true where id = %L', c)));
  select count(*) into n from public.consultas_para_lembrete(now(), now() + interval '2 days') where consulta_id = con;
  out := out || pg_temp.chk('com lembretes ligados: entra', '1', n::text);
  update public.utentes set lembretes_email = false where id = ut;
  select count(*) into n from public.consultas_para_lembrete(now(), now() + interval '2 days') where consulta_id = con;
  out := out || pg_temp.chk('utente excluído: não entra', '0', n::text);
  update public.utentes set lembretes_email = true where id = ut;
  perform public.marcar_lembrete_enviado(con);
  select count(*) into n from public.consultas_para_lembrete(now(), now() + interval '2 days') where consulta_id = con;
  out := out || pg_temp.chk('já enviado: não repete', '0', n::text);
  perform pg_temp.tentar(u_medico, format('update public.consultas set inicio = inicio + interval %L where id = %L', '2 hours', con));
  select count(*) into n from public.consultas_para_lembrete(now(), now() + interval '2 days') where consulta_id = con;
  out := out || pg_temp.chk('consulta mudou de hora: volta a lembrar', '1', n::text);

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
