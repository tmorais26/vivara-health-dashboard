-- Teste das regras de acesso de medicação e alergias.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_dona uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid(); u_nutri uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  c uuid; m_medico uuid; m_nutri uuid; m_admin uuid; ut uuid; med uuid; out text := '';
begin
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  create function pg_temp.contar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin
    perform pg_temp.como(p_user); execute p_sql into n; execute 'reset role'; return n::text;
  end $f$;
  create function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin
    perform pg_temp.como(p_user);
    begin
      execute p_sql;
      get diagnostics n = row_count;
    exception when others then execute 'reset role'; return 'bloqueado';
    end;
    execute 'reset role';
    return case when n = 0 then 'sem_efeito' else 'ok' end;
  end $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-med-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_medico, 'medico'), (u_nutri, 'nutri'), (u_admin, 'admin')) as x(id, n);
  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-med-clinica', 'Dona', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-med-medico@vivara.invalid', 'Médico', 'medico');
  m_nutri := public.convidar_membro(c, 'teste-med-nutri@vivara.invalid', 'Nutricionista', 'profissional', 'Nutricionista');
  m_admin := public.convidar_membro(c, 'teste-med-admin@vivara.invalid', 'Administrativa', 'administrativo');
  execute 'reset role';

  ut := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.utentes (id, espaco_id, nome, criado_por) values (%L, %L, %L, %L)', ut, c, 'Utente', m_medico));

  med := gen_random_uuid();
  out := out || pg_temp.chk('médico regista medicação (returning)', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.medicacoes (id, espaco_id, utente_id, autor_id, dci, posologia, origem, numero_receita) values (%L,%L,%L,%L,%L,%L,%L,%L) returning id',
      med, c, ut, m_medico, 'Metformina', '1 cp 12/12h', 'pem_spms', '1011000012345678901')));
  out := out || pg_temp.chk('número de receita com letras é recusado', 'bloqueado', pg_temp.tentar(u_medico,
    format('insert into public.medicacoes (espaco_id, utente_id, autor_id, dci, posologia, numero_receita) values (%L,%L,%L,%L,%L,%L)',
      c, ut, m_medico, 'X', 'y', 'ABC123')));
  out := out || pg_temp.chk('médico regista alergia', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.alergias (espaco_id, utente_id, autor_id, substancia, gravidade) values (%L,%L,%L,%L,%L) returning id',
      c, ut, m_medico, 'Penicilina', 'grave')));
  out := out || pg_temp.chk('nutricionista que não segue não vê medicação', '0',
    pg_temp.contar(u_nutri, format('select count(*) from public.medicacoes where utente_id = %L', ut)));
  out := out || pg_temp.chk('nutricionista que não segue não regista', 'bloqueado', pg_temp.tentar(u_nutri,
    format('insert into public.medicacoes (espaco_id, utente_id, autor_id, dci, posologia) values (%L,%L,%L,%L,%L)', c, ut, m_nutri, 'X', 'y')));
  out := out || pg_temp.chk('administrativa não vê medicação', '0',
    pg_temp.contar(u_admin, format('select count(*) from public.medicacoes where utente_id = %L', ut)));
  out := out || pg_temp.chk('dona não vê alergias', '0',
    pg_temp.contar(u_dona, format('select count(*) from public.alergias where utente_id = %L', ut)));
  out := out || pg_temp.chk('administrativa não altera', 'sem_efeito', pg_temp.tentar(u_admin,
    format('update public.medicacoes set posologia = %L where id = %L', 'x', med)));

  out := out || pg_temp.chk('consulta marcada com a nutricionista', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por) values (%L,%L,%L,now(),30,%L)', c, ut, m_nutri, m_medico)));
  out := out || pg_temp.chk('nutricionista que segue vê medicação', '1',
    pg_temp.contar(u_nutri, format('select count(*) from public.medicacoes where utente_id = %L', ut)));
  perform pg_temp.tentar(u_nutri, format('update public.medicacoes set autor_id = %L, posologia = %L where id = %L', m_nutri, '1 cp/dia', med));
  out := out || pg_temp.chk('colega que segue altera, mas o autor mantém-se', 'sim',
    (select case when autor_id = m_medico and posologia = '1 cp/dia' then 'sim' else 'não' end from public.medicacoes where id = med));

  out := out || pg_temp.chk('suspender medicação', 'ok', pg_temp.tentar(u_medico,
    format('update public.medicacoes set estado = %L, estado_motivo = %L where id = %L', 'suspensa', 'efeitos adversos', med)));
  out := out || pg_temp.chk('data da mudança de estado preenchida', 'sim',
    (select case when estado_em is not null then 'sim' else 'não' end from public.medicacoes where id = med));
  out := out || pg_temp.chk('não se apaga', 'sem_efeito', pg_temp.tentar(u_medico,
    format('delete from public.medicacoes where id = %L', med)));
  out := out || pg_temp.chk('alterações na auditoria (criar + 2 alterações)', '3',
    (select count(*)::text from public.auditoria where espaco_id = c and acao like 'medicacoes_%'));

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
