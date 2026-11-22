-- Teste das regras do programa de recomendação.
-- Termina sempre com um erro que lista os resultados: assim tudo é revertido e nada fica na base de dados.
do $do$
declare
  a uuid; b uuid; c uuid; u uuid; p2 uuid; dup uuid; e uuid; i int; x uuid;
  cod_a text; cod_p2 text; r text; resumo jsonb; out text := '';
begin
  create function pg_temp.conta(p_email text, p_role text) returns uuid language plpgsql as $f$
  declare v uuid := gen_random_uuid();
  begin
    insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at)
    values (v, p_email, 'authenticated', 'authenticated', jsonb_build_object('role', p_role), now());
    if p_role = 'physician' then insert into public.medico_perfis (user_id, nome) values (v, p_email); end if;
    return v;
  end $f$;
  create function pg_temp.como(p_user uuid) returns void language plpgsql as $f$
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end $f$;
  create function pg_temp.usar(p_user uuid, p_codigo text) returns text language plpgsql as $f$
  declare r text;
  begin
    perform pg_temp.como(p_user);
    r := public.usar_codigo(p_codigo);
    execute 'reset role';
    return r;
  end $f$;
  create function pg_temp.meses(p_user uuid) returns int language sql as $f$
    select count(*)::int from public.meses_gratis where beneficiario_id = p_user and estado in ('por_aplicar', 'aplicado')
  $f$;
  create function pg_temp.chk(t text, esperado text, obtido text) returns text language sql as $f$
    select (case when esperado = obtido then 'OK   ' else 'FALHA' end) || ' | ' || t || ' | esperado=' || esperado || ' obtido=' || coalesce(obtido, 'null') || E'\n'
  $f$;

  a := pg_temp.conta('teste-rec-a@example.com', 'physician');
  select codigo into cod_a from public.codigos_recomendacao where user_id = a;
  out := out || pg_temp.chk('código gerado ao criar a conta', 'sim', case when cod_a ~ '^VIV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' then 'sim' else coalesce(cod_a, 'nulo') end);
  out := out || pg_temp.chk('não pode usar o próprio código', 'proprio_codigo', pg_temp.usar(a, cod_a));

  -- Médico → utente: só o utente ganha.
  u := pg_temp.conta('teste-rec-utente@example.com', 'patient');
  out := out || pg_temp.chk('utente usa código do médico', 'ok', pg_temp.usar(u, cod_a));
  out := out || pg_temp.chk('antes do pagamento: utente sem mês', '0', pg_temp.meses(u)::text);
  perform public.registar_primeiro_pagamento(u);
  out := out || pg_temp.chk('após pagamento: utente ganha 1 mês', '1', pg_temp.meses(u)::text);
  out := out || pg_temp.chk('médico NÃO ganha nada por recomendar utente', '0', pg_temp.meses(a)::text);
  out := out || pg_temp.chk('um só código por conta', 'ja_usado', pg_temp.usar(u, cod_a));

  -- Médico → médico: ambos ganham.
  b := pg_temp.conta('teste-rec-b@example.com', 'physician');
  out := out || pg_temp.chk('médico usa código de médico', 'ok', pg_temp.usar(b, cod_a));
  out := out || pg_temp.chk('antes do pagamento: nenhum mês', '0', (pg_temp.meses(a) + pg_temp.meses(b))::text);
  perform public.registar_primeiro_pagamento(b);
  out := out || pg_temp.chk('após pagamento: médico convidado ganha 1', '1', pg_temp.meses(b)::text);
  out := out || pg_temp.chk('após pagamento: médico que convidou ganha 1', '1', pg_temp.meses(a)::text);
  perform public.registar_primeiro_pagamento(b);
  out := out || pg_temp.chk('segundo pagamento não dá mais meses', '1', pg_temp.meses(b)::text);

  -- Utente → médico: o médico ganha o 1.º mês.
  p2 := pg_temp.conta('teste-rec-p2@example.com', 'patient');
  perform pg_temp.como(p2);
  cod_p2 := public.meu_codigo_utente();
  execute 'reset role';
  c := pg_temp.conta('teste-rec-c@example.com', 'physician');
  out := out || pg_temp.chk('médico usa código de utente', 'ok', pg_temp.usar(c, cod_p2));
  perform public.registar_primeiro_pagamento(c);
  out := out || pg_temp.chk('médico ganha o 1.º mês', '1', pg_temp.meses(c)::text);
  out := out || pg_temp.chk('utente que recomendou não ganha', '0', pg_temp.meses(p2)::text);
  x := pg_temp.conta('teste-rec-p3@example.com', 'patient');
  out := out || pg_temp.chk('utente não pode usar código de utente', 'nao_aplicavel', pg_temp.usar(x, cod_p2));

  -- Contas repetidas não contam.
  dup := pg_temp.conta('teste.rec.a+2@gmail.com', 'physician');
  perform pg_temp.conta('testereca@gmail.com', 'physician');
  perform pg_temp.usar(dup, cod_a);
  out := out || pg_temp.chk('conta repetida é anulada', 'anulado', (select estado from public.recomendacoes where convidado_id = dup));

  -- Limite de 12 meses por ano.
  for i in 1..12 loop
    e := pg_temp.conta('teste-rec-lim' || i || '@example.com', 'physician');
    perform pg_temp.usar(e, cod_a);
    perform public.registar_primeiro_pagamento(e);
  end loop;
  out := out || pg_temp.chk('limite de 12 meses por ano', '12', pg_temp.meses(a)::text);
  out := out || pg_temp.chk('excedente fica limite_atingido', '1', (select count(*) from public.meses_gratis where beneficiario_id = a and estado = 'limite_atingido')::text);

  -- Só totais, nunca identidades.
  perform pg_temp.como(a);
  resumo := public.resumo_recomendacoes();
  r := 'ok';
  perform 1 from public.recomendacoes limit 1;
  if found then r := 'vê linhas'; end if;
  execute 'reset role';
  out := out || pg_temp.chk('resumo: utentes pelo código', '1', resumo->>'utentes');
  out := out || pg_temp.chk('resumo: médicos (sem anulados)', '13', resumo->>'medicos');
  out := out || pg_temp.chk('resumo: meses no ano', '12', resumo->>'meses_ano');
  out := out || pg_temp.chk('médico não lê recomendações diretamente', 'ok', r);

  perform pg_temp.como(a);
  begin
    perform public.registar_primeiro_pagamento(a);
    r := 'executou';
  exception when others then r := 'bloqueado';
  end;
  execute 'reset role';
  out := out || pg_temp.chk('utilizador não pode simular pagamento', 'bloqueado', r);

  raise exception E'RESULTADOS (tudo revertido)\n%', out;
end $do$;
