-- Teste do chat do lado da app do utente.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_med uuid := gen_random_uuid(); u_pac uuid := gen_random_uuid(); u_outro uuid := gen_random_uuid();
  c uuid; m_med uuid; ut uuid; tok uuid; r text; n int; out text := '';
begin
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  create function pg_temp.sistema() returns void language plpgsql as $f$
  begin execute 'reset role'; perform set_config('request.jwt.claims', '', true); end $f$;
  create function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin
    perform pg_temp.como(p_user);
    begin execute p_sql; get diagnostics n = row_count;
    exception when others then perform pg_temp.sistema(); return 'bloqueado'; end;
    perform pg_temp.sistema();
    return case when n = 0 then 'sem_efeito' else 'ok' end;
  end $f$;
  create function pg_temp.valor(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare v text;
  begin
    perform pg_temp.como(p_user);
    begin execute p_sql into v; exception when others then perform pg_temp.sistema(); return 'erro'; end;
    perform pg_temp.sistema(); return v;
  end $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role, created_at)
  select x.id, 'teste-chat-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated', x.criado
  from (values (u_med, 'medico', now()), (u_pac, 'utente', now() - interval '30 days'), (u_outro, 'outro', now())) as x(id, n, criado);
  perform pg_temp.como(u_med);
  c := public.criar_espaco('individual', 'Consultório Teste', 'Dra. Teste', 'medico');
  perform pg_temp.sistema();
  select id into m_med from public.membros where espaco_id = c;
  ut := gen_random_uuid();
  perform pg_temp.tentar(u_med, format('insert into public.utentes (id, espaco_id, nome, criado_por) values (%L,%L,%L,%L)', ut, c, 'Joana', m_med));

  -- Convite aceite por uma conta antiga (30 dias): liga na mesma, sem recomendação.
  insert into public.convites_app (convidante_id, utente_id) values (u_med, ut) returning token into tok;
  out := out || pg_temp.chk('aceitar convite (conta antiga)', 'ok', pg_temp.valor(u_pac, format('select public.aceitar_convite_app(%L)', tok)));
  out := out || pg_temp.chk('conta ligada à ficha', '1', (select count(*)::text from public.utente_contas where utente_id = ut and user_id = u_pac));
  out := out || pg_temp.chk('conta antiga não gera recomendação', '0', (select count(*)::text from public.recomendacoes where convidado_id = u_pac));
  out := out || pg_temp.chk('convite não se usa duas vezes', 'convite_invalido', pg_temp.valor(u_outro, format('select public.aceitar_convite_app(%L)', tok)));
  out := out || pg_temp.chk('médico vê que o utente tem a app', '1', pg_temp.valor(u_med, format('select count(*) from public.utente_contas where utente_id = %L', ut)));

  -- Chat desativado (o médico ainda não começou).
  out := out || pg_temp.chk('desativado: sem conversas na app', '0', pg_temp.valor(u_pac, 'select count(*) from public.minhas_conversas()'));
  out := out || pg_temp.chk('desativado: não envia', 'erro', pg_temp.valor(u_pac, format('select public.enviar_mensagem_app(%L, %L)', ut, 'olá')));
  out := out || pg_temp.chk('utente não consegue ligar o chat', 'erro', pg_temp.valor(u_pac, format('select public.definir_chat(%L, %L)', ut, 'ativo')));

  -- O médico ativa.
  perform pg_temp.valor(u_med, format('select public.definir_chat(%L, %L)', ut, 'ativo'));
  perform pg_temp.tentar(u_med, format('insert into public.chat_mensagens (espaco_id, utente_id, autor_membro_id, texto) values (%L,%L,%L,%L)', c, ut, m_med, 'Bom dia, Joana'));
  out := out || pg_temp.chk('ativo: conversa aparece na app', '1', pg_temp.valor(u_pac, 'select count(*) from public.minhas_conversas()'));
  out := out || pg_temp.chk('ativo: nome do consultório', 'Consultório Teste', pg_temp.valor(u_pac, 'select espaco_nome from public.minhas_conversas()'));
  out := out || pg_temp.chk('ativo: utente lê a mensagem do médico', '1', pg_temp.valor(u_pac, format('select count(*) from public.chat_mensagens where utente_id = %L', ut)));
  out := out || pg_temp.chk('ativo: utente envia', 'sim', (select case when pg_temp.valor(u_pac, format('select public.enviar_mensagem_app(%L, %L)', ut, 'Obrigada!')) ~ '^[0-9a-f-]{36}$' then 'sim' else 'não' end));
  out := out || pg_temp.chk('médico é notificado', '1', (select count(*)::text from public.notificacoes where user_id = u_med and tipo = 'mensagem'));
  out := out || pg_temp.chk('médico vê a mensagem do utente', '2', pg_temp.valor(u_med, format('select count(*) from public.chat_mensagens where utente_id = %L', ut)));
  out := out || pg_temp.chk('utente não se faz passar pelo médico', 'bloqueado', pg_temp.tentar(u_pac,
    format('insert into public.chat_mensagens (espaco_id, utente_id, do_utente, autor_membro_id, texto) values (%L,%L,false,%L,%L)', c, ut, m_med, 'x')));
  out := out || pg_temp.chk('anexo fora da conversa é recusado', 'erro', pg_temp.valor(u_pac,
    format('select public.enviar_mensagem_app(%L, %L, %L::jsonb)', ut, '', '[{"path":"outro/sitio/x.pdf","nome":"x.pdf","tipo":"application/pdf","tamanho":10}]')));
  out := out || pg_temp.chk('outra pessoa não lê a conversa', '0', pg_temp.valor(u_outro, format('select count(*) from public.chat_mensagens where utente_id = %L', ut)));
  out := out || pg_temp.chk('outra pessoa não envia', 'erro', pg_temp.valor(u_outro, format('select public.enviar_mensagem_app(%L, %L)', ut, 'x')));

  -- Bloqueado: lê, não escreve.
  perform pg_temp.valor(u_med, format('select public.definir_chat(%L, %L)', ut, 'bloqueado'));
  out := out || pg_temp.chk('bloqueado: continua a ler', '2', pg_temp.valor(u_pac, format('select count(*) from public.chat_mensagens where utente_id = %L', ut)));
  out := out || pg_temp.chk('bloqueado: não envia', 'erro', pg_temp.valor(u_pac, format('select public.enviar_mensagem_app(%L, %L)', ut, 'x')));

  -- Desativado: desaparece.
  perform pg_temp.valor(u_med, format('select public.definir_chat(%L, %L)', ut, 'desativado'));
  out := out || pg_temp.chk('desativado: não lê', '0', pg_temp.valor(u_pac, format('select count(*) from public.chat_mensagens where utente_id = %L', ut)));
  out := out || pg_temp.chk('desativado: sem conversas', '0', pg_temp.valor(u_pac, 'select count(*) from public.minhas_conversas()'));

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
