-- Teste das regras de acesso de análises, resultados, alvos e ficheiros.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_dona uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid(); u_nutri uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  c uuid; m_medico uuid; m_nutri uuid; m_admin uuid; ut uuid; ut2 uuid; an uuid; out text := '';
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
  create function pg_temp.permitido(p_user uuid, p_nome text) returns text language plpgsql as $f$
  declare r boolean;
  begin
    perform pg_temp.como(p_user); r := public.ficheiro_clinico_permitido(p_nome); execute 'reset role'; return r::text;
  end $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-ana-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_medico, 'medico'), (u_nutri, 'nutri'), (u_admin, 'admin')) as x(id, n);
  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-ana-clinica', 'Dona', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-ana-medico@vivara.invalid', 'Médico', 'medico');
  m_nutri := public.convidar_membro(c, 'teste-ana-nutri@vivara.invalid', 'Nutricionista', 'profissional', 'Nutricionista');
  m_admin := public.convidar_membro(c, 'teste-ana-admin@vivara.invalid', 'Administrativa', 'administrativo');
  execute 'reset role';

  ut := gen_random_uuid(); ut2 := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.utentes (id, espaco_id, nome, criado_por) values (%L,%L,%L,%L),(%L,%L,%L,%L)',
    ut, c, 'Utente', m_medico, ut2, c, 'Outro', m_medico));

  an := gen_random_uuid();
  out := out || pg_temp.chk('médico regista análise (returning)', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.analises (id, espaco_id, utente_id, autor_id, data_colheita, laboratorio) values (%L,%L,%L,%L,current_date,%L) returning id', an, c, ut, m_medico, 'Lab')));
  out := out || pg_temp.chk('médico regista resultados', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.resultados (analise_id, espaco_id, utente_id, autor_id, marcador, valor, valor_texto, unidade, ref_min, ref_max) values (%L,%L,%L,%L,%L,154,null,%L,0,130),(%L,%L,%L,%L,%L,null,%L,null,null,null) returning id',
      an, c, ut, m_medico, 'Colesterol LDL', 'mg/dL', an, c, ut, m_medico, 'Urina tipo II', 'Normal')));
  out := out || pg_temp.chk('resultado sem valor nem texto é recusado', 'bloqueado', pg_temp.tentar(u_medico,
    format('insert into public.resultados (analise_id, espaco_id, utente_id, autor_id, marcador) values (%L,%L,%L,%L,%L)', an, c, ut, m_medico, 'X')));
  out := out || pg_temp.chk('resultado noutro utente que não o da análise é recusado', 'bloqueado', pg_temp.tentar(u_medico,
    format('insert into public.resultados (analise_id, espaco_id, utente_id, autor_id, marcador, valor) values (%L,%L,%L,%L,%L,1)', an, c, ut2, m_medico, 'X')));
  out := out || pg_temp.chk('médico define alvo', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.alvos_marcador (espaco_id, utente_id, autor_id, marcador, alvo_max, justificacao) values (%L,%L,%L,%L,100,%L) returning id', c, ut, m_medico, 'Colesterol LDL', 'prevenção primária')));
  out := out || pg_temp.chk('alvo com mínimo > máximo é recusado', 'bloqueado', pg_temp.tentar(u_medico,
    format('insert into public.alvos_marcador (espaco_id, utente_id, autor_id, marcador, alvo_min, alvo_max) values (%L,%L,%L,%L,10,5)', c, ut, m_medico, 'HDL')));

  out := out || pg_temp.chk('nutricionista que não segue não vê resultados', '0',
    pg_temp.contar(u_nutri, format('select count(*) from public.resultados where utente_id = %L', ut)));
  out := out || pg_temp.chk('administrativa não vê análises', '0',
    pg_temp.contar(u_admin, format('select count(*) from public.analises where utente_id = %L', ut)));
  out := out || pg_temp.chk('dona não vê alvos', '0',
    pg_temp.contar(u_dona, format('select count(*) from public.alvos_marcador where utente_id = %L', ut)));
  out := out || pg_temp.chk('nutricionista que não segue não regista', 'bloqueado', pg_temp.tentar(u_nutri,
    format('insert into public.analises (espaco_id, utente_id, autor_id, data_colheita) values (%L,%L,%L,current_date)', c, ut, m_nutri)));

  out := out || pg_temp.chk('ficheiro: médico que segue pode', 'true', pg_temp.permitido(u_medico, c || '/' || ut || '/x.pdf'));
  out := out || pg_temp.chk('ficheiro: nutricionista que não segue não pode', 'false', pg_temp.permitido(u_nutri, c || '/' || ut || '/x.pdf'));
  out := out || pg_temp.chk('ficheiro: caminho com espaço trocado não pode', 'false', pg_temp.permitido(u_medico, gen_random_uuid() || '/' || ut || '/x.pdf'));

  perform pg_temp.tentar(u_medico, format('insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por) values (%L,%L,%L,now(),30,%L)', c, ut, m_nutri, m_medico));
  out := out || pg_temp.chk('nutricionista que passa a seguir vê resultados', '2',
    pg_temp.contar(u_nutri, format('select count(*) from public.resultados where utente_id = %L', ut)));

  out := out || pg_temp.chk('marcar análise como erro', 'ok', pg_temp.tentar(u_medico,
    format('update public.analises set estado = %L where id = %L', 'erro', an)));
  out := out || pg_temp.chk('não se apaga', 'sem_efeito', pg_temp.tentar(u_medico,
    format('delete from public.analises where id = %L', an)));
  out := out || pg_temp.chk('auditoria regista análise, resultados e alvo', 'sim',
    (select case when count(*) >= 5 then 'sim' else count(*)::text end from public.auditoria
     where espaco_id = c and (acao like 'analises_%' or acao like 'resultados_%' or acao like 'alvos_marcador_%')));

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
