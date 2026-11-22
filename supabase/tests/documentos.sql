-- Teste das regras de acesso de declarações, atestados e modelos.
-- Termina sempre com um erro que lista os resultados: tudo é revertido e nada fica na base de dados.
do $do$
declare
  u_dona uuid := gen_random_uuid(); u_medico uuid := gen_random_uuid(); u_nutri uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid(); u_fora uuid := gen_random_uuid();
  c uuid; m_dona uuid; m_medico uuid; m_nutri uuid; m_admin uuid; ut uuid; d_med uuid; d_adm uuid; mod uuid;
  r text; out text := '';
begin
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  create function pg_temp.contar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  declare n int;
  begin
    perform pg_temp.como(p_user);
    execute p_sql into n;
    execute 'reset role';
    return n::text;
  end $f$;
  create function pg_temp.tentar(p_user uuid, p_sql text) returns text language plpgsql as $f$
  begin
    perform pg_temp.como(p_user);
    begin
      execute p_sql;
    exception when others then
      execute 'reset role';
      return 'bloqueado';
    end;
    execute 'reset role';
    return 'ok';
  end $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  insert into auth.users (id, email, aud, role)
  select x.id, 'teste-doc-' || x.n || '@vivara.invalid', 'authenticated', 'authenticated'
  from (values (u_dona, 'dona'), (u_medico, 'medico'), (u_nutri, 'nutri'), (u_admin, 'admin'), (u_fora, 'fora')) as x(id, n);

  perform pg_temp.como(u_dona);
  c := public.criar_espaco('clinica', 'teste-doc-clinica', 'Dona', 'administrativo');
  m_medico := public.convidar_membro(c, 'teste-doc-medico@vivara.invalid', 'Médico', 'medico');
  m_nutri := public.convidar_membro(c, 'teste-doc-nutri@vivara.invalid', 'Nutricionista', 'profissional', 'Nutricionista');
  m_admin := public.convidar_membro(c, 'teste-doc-admin@vivara.invalid', 'Administrativa', 'administrativo');
  execute 'reset role';
  select id into m_dona from public.membros where espaco_id = c and user_id = u_dona;

  -- O médico cria o utente (passa a segui-lo).
  ut := gen_random_uuid();
  out := out || pg_temp.chk('médico cria utente', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.utentes (id, espaco_id, nome, criado_por) values (%L, %L, %L, %L)', ut, c, 'Utente Teste', m_medico)));

  -- Médico emite atestado e lê-o de volta (INSERT ... RETURNING).
  d_med := gen_random_uuid();
  out := out || pg_temp.chk('médico emite atestado (com returning)', 'ok', pg_temp.tentar(u_medico,
    format('insert into public.documentos_emitidos (id, espaco_id, utente_id, autor_id, tipo, titulo, corpo) values (%L, %L, %L, %L, %L, %L, %L) returning id',
           d_med, c, ut, m_medico, 'atestado', 'Atestado', 'texto')));

  -- Administrativa: presença sim, atestado não.
  d_adm := gen_random_uuid();
  out := out || pg_temp.chk('administrativa emite declaração de presença', 'ok', pg_temp.tentar(u_admin,
    format('insert into public.documentos_emitidos (id, espaco_id, utente_id, autor_id, tipo, titulo, corpo) values (%L, %L, %L, %L, %L, %L, %L) returning id',
           d_adm, c, ut, m_admin, 'presenca', 'Declaração', 'texto')));
  out := out || pg_temp.chk('administrativa não emite atestado', 'bloqueado', pg_temp.tentar(u_admin,
    format('insert into public.documentos_emitidos (espaco_id, utente_id, autor_id, tipo, titulo, corpo) values (%L, %L, %L, %L, %L, %L)',
           c, ut, m_admin, 'atestado', 'Atestado', 'texto')));

  -- Não segue o utente: não emite nem vê.
  out := out || pg_temp.chk('nutricionista que não segue não emite', 'bloqueado', pg_temp.tentar(u_nutri,
    format('insert into public.documentos_emitidos (espaco_id, utente_id, autor_id, tipo, titulo, corpo) values (%L, %L, %L, %L, %L, %L)',
           c, ut, m_nutri, 'relatorio', 'Relatório', 'texto')));
  out := out || pg_temp.chk('nutricionista que não segue não vê documentos', '0',
    pg_temp.contar(u_nutri, format('select count(*) from public.documentos_emitidos where utente_id = %L', ut)));

  -- Não se pode emitir em nome de outro membro.
  out := out || pg_temp.chk('não emite em nome de outro', 'bloqueado', pg_temp.tentar(u_admin,
    format('insert into public.documentos_emitidos (espaco_id, utente_id, autor_id, tipo, titulo, corpo) values (%L, %L, %L, %L, %L, %L)',
           c, ut, m_medico, 'presenca', 'Declaração', 'texto')));

  -- Leitura.
  out := out || pg_temp.chk('médico que segue vê os 2 documentos', '2',
    pg_temp.contar(u_medico, format('select count(*) from public.documentos_emitidos where utente_id = %L', ut)));
  out := out || pg_temp.chk('administrativa vê só o que emitiu', '1',
    pg_temp.contar(u_admin, format('select count(*) from public.documentos_emitidos where utente_id = %L', ut)));
  out := out || pg_temp.chk('dona (administração) não vê atestados', '0',
    pg_temp.contar(u_dona, format('select count(*) from public.documentos_emitidos where utente_id = %L', ut)));
  out := out || pg_temp.chk('pessoa de fora não vê nada', '0',
    pg_temp.contar(u_fora, format('select count(*) from public.documentos_emitidos where utente_id = %L', ut)));

  -- Imutável: nem o autor altera ou apaga.
  perform pg_temp.tentar(u_medico, format('update public.documentos_emitidos set corpo = %L where id = %L', 'alterado', d_med));
  perform pg_temp.tentar(u_medico, format('delete from public.documentos_emitidos where id = %L', d_med));
  out := out || pg_temp.chk('documento emitido não muda nem desaparece', 'texto',
    (select corpo from public.documentos_emitidos where id = d_med));

  -- Auditoria.
  out := out || pg_temp.chk('emissões ficam na auditoria', '2',
    (select count(*)::text from public.auditoria where espaco_id = c and acao = 'documento_emitido'));

  -- Modelos: privado por omissão, partilhado com a equipa quando escolhido.
  mod := gen_random_uuid();
  perform pg_temp.tentar(u_medico, format('insert into public.modelos_documento (id, espaco_id, autor_id, tipo, nome, corpo) values (%L, %L, %L, %L, %L, %L)',
    mod, c, m_medico, 'atestado', 'Meu modelo', '{{utente.nome}}'));
  out := out || pg_temp.chk('modelo privado não é visto pela colega', '0',
    pg_temp.contar(u_nutri, format('select count(*) from public.modelos_documento where id = %L', mod)));
  perform pg_temp.tentar(u_medico, format('update public.modelos_documento set partilhado = true where id = %L', mod));
  out := out || pg_temp.chk('modelo partilhado é visto pela colega', '1',
    pg_temp.contar(u_nutri, format('select count(*) from public.modelos_documento where id = %L', mod)));
  perform pg_temp.tentar(u_nutri, format('delete from public.modelos_documento where id = %L', mod));
  out := out || pg_temp.chk('colega não apaga modelo de outro', '1',
    (select count(*)::text from public.modelos_documento where id = mod));

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
