-- Teste das notificações: eventos, verificação diária (sem duplicados) e preferências.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_dona uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid(); u_nutri uuid := gen_random_uuid();
  c uuid; m_medico uuid; m_nutri uuid; ut uuid; d uuid; out text := '';
begin
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  -- Volta a "sistema" (sem utilizador), como a tarefa diária.
  create function pg_temp.sistema() returns void language plpgsql as $f$
  begin
    execute 'reset role';
    perform set_config('request.jwt.claims', '', true);
  end $f$;
  create function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  begin
    perform pg_temp.como(p_user);
    begin execute p_sql; exception when others then perform pg_temp.sistema(); return 'erro: ' || sqlerrm; end;
    perform pg_temp.sistema(); return 'ok';
  end $f$;
  create function pg_temp.n(p_user uuid, p_tipo text) returns text language sql as $f$
    select count(*)::text from public.notificacoes where user_id = p_user and tipo = p_tipo
  $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-not-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_medico, 'medico'), (u_nutri, 'nutri')) as x(id, n);
  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-not-clinica', 'Dona', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-not-medico@vivara.invalid', 'Dr. Teste', 'medico');
  m_nutri := public.convidar_membro(c, 'teste-not-nutri@vivara.invalid', 'Nutri', 'profissional', 'Nutricionista');
  perform pg_temp.sistema();
  out := out || pg_temp.chk('adicionado à clínica → notificado', '1', pg_temp.n(u_medico, 'membro'));
  out := out || pg_temp.chk('quem cria a clínica não se notifica a si', '0', pg_temp.n(u_dona, 'membro'));

  ut := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.utentes (id, espaco_id, nome, criado_por) values (%L,%L,%L,%L)', ut, c, 'Utente', m_medico));
  perform pg_temp.tentar(u_medico, format('insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por) values (%L,%L,%L,now() + interval %L,30,%L)', c, ut, m_nutri, '3 days', m_medico));
  out := out || pg_temp.chk('consulta marcada por colega → notificado', '1', pg_temp.n(u_nutri, 'consulta'));

  insert into public.chat_mensagens (espaco_id, utente_id, do_utente, texto) values (c, ut, true, 'Olá');
  out := out || pg_temp.chk('mensagem do utente → médico que segue', '1', pg_temp.n(u_medico, 'mensagem'));
  out := out || pg_temp.chk('mensagem do utente → nutricionista que segue', '1', pg_temp.n(u_nutri, 'mensagem'));
  out := out || pg_temp.chk('mensagem do utente → dona não segue', '0', pg_temp.n(u_dona, 'mensagem'));

  perform pg_temp.tentar(u_medico, format('insert into public.analises (espaco_id, utente_id, autor_id, data_colheita) values (%L,%L,%L,current_date)', c, ut, m_medico));
  out := out || pg_temp.chk('análise de colega → notificado', '1', pg_temp.n(u_nutri, 'analise'));
  out := out || pg_temp.chk('autor da análise não se notifica', '0', pg_temp.n(u_medico, 'analise'));

  d := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.diarios (id, espaco_id, utente_id, autor_id, texto, visibilidade) values (%L,%L,%L,%L,%L,%L)', d, c, ut, m_medico, 'nota', 'privado'));
  perform pg_temp.tentar(u_medico, format('insert into public.diario_partilhas (diario_id, membro_id) values (%L,%L)', d, m_nutri));
  out := out || pg_temp.chk('diário partilhado → notificado', '1', pg_temp.n(u_nutri, 'partilha'));

  insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por)
    values (c, ut, m_medico, now() - interval '2 days', 30, m_medico);
  insert into public.consultas (espaco_id, utente_id, profissional_id, inicio, duracao_min, criado_por)
    values (c, ut, m_medico, ((now() at time zone 'Europe/Lisbon')::date + time '23:30') at time zone 'Europe/Lisbon', 15, m_medico);
  insert into public.pedidos_exame (espaco_id, utente_id, autor_id, descricao, pedido_em) values (c, ut, m_medico, 'Hemograma', current_date - 40);
  insert into public.medicacoes (espaco_id, utente_id, autor_id, dci, posologia, fim) values (c, ut, m_medico, 'Amoxicilina', '1 cp 8/8h', current_date + 2);
  insert into public.medicacoes (espaco_id, utente_id, autor_id, dci, posologia, fim) values (c, ut, m_medico, 'Ibuprofeno', '1 cp', current_date + 20);
  perform public.gerar_notificacoes_diarias();
  perform public.gerar_notificacoes_diarias();
  out := out || pg_temp.chk('agenda de hoje (uma vez, mesmo a correr 2x)', '1', pg_temp.n(u_medico, 'agenda_hoje'));
  out := out || pg_temp.chk('consulta por fechar (uma vez)', '1', pg_temp.n(u_medico, 'consulta_por_fechar'));
  out := out || pg_temp.chk('exame atrasado (uma vez)', '1', pg_temp.n(u_medico, 'exame_atrasado'));
  out := out || pg_temp.chk('medicação a terminar em 2 dias (e não a de 20)', '1', pg_temp.n(u_medico, 'medicacao_fim'));

  insert into public.preferencias_notificacao (user_id, desligadas) values (u_nutri, array['mensagem']);
  insert into public.chat_mensagens (espaco_id, utente_id, do_utente, texto) values (c, ut, true, 'Outra');
  out := out || pg_temp.chk('tipo desligado não chega', '1', pg_temp.n(u_nutri, 'mensagem'));
  out := out || pg_temp.chk('tipo ligado continua a chegar', '2', pg_temp.n(u_medico, 'mensagem'));
  out := out || pg_temp.chk('tarefa diária agendada', '1', (select count(*)::text from cron.job where jobname = 'vivara-notificacoes-diarias'));

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
