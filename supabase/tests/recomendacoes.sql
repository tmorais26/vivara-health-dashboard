-- Teste das regras do programa de recomendação. Cria contas "teste-rec-" e apaga tudo no fim.
create or replace function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.conta(p_email text, p_role text) returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at)
  values (v, p_email, 'authenticated', 'authenticated', jsonb_build_object('role', p_role), now());
  return v;
end $$;

create or replace function pg_temp.usar(p_user uuid, p_codigo text) returns text language plpgsql as $$
declare r text;
begin
  perform pg_temp.como(p_user);
  r := public.usar_codigo(p_codigo);
  execute 'reset role';
  return r;
end $$;

create or replace function pg_temp.meses(p_user uuid) returns int language sql as $$
  select count(*)::int from public.meses_gratis where beneficiario_id = p_user and estado in ('por_aplicar', 'aplicado')
$$;

create or replace function pg_temp.testes() returns table (teste text, esperado text, obtido text) language plpgsql as $$
declare
  a uuid; b uuid; c uuid; u uuid; p2 uuid; dup uuid; e uuid; i int; x uuid;
  cod_a text; cod_p2 text; r text; resumo jsonb;
begin
  a := pg_temp.conta('teste-rec-a@example.com', 'physician');
  perform pg_temp.como(a);
  perform public.criar_espaco('individual', 'teste-rec-espaco', 'Dr. A', 'medico');
  execute 'reset role';
  select codigo into cod_a from public.codigos_recomendacao where user_id = a;
  return query select 'código gerado ao criar a conta', 'sim', case when cod_a ~ '^VIV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' then 'sim' else coalesce(cod_a, 'nulo') end;

  r := pg_temp.usar(a, cod_a);
  return query select 'não pode usar o próprio código', 'proprio_codigo', r;

  -- Médico → utente
  u := pg_temp.conta('teste-rec-utente@example.com', 'patient');
  r := pg_temp.usar(u, cod_a);
  return query select 'utente usa código do médico', 'ok', r;
  return query select 'antes do pagamento: utente sem mês', '0', pg_temp.meses(u)::text;
  perform public.registar_primeiro_pagamento(u);
  return query select 'após pagamento: utente ganha 1 mês', '1', pg_temp.meses(u)::text;
  return query select 'médico NÃO ganha nada por recomendar utente', '0', pg_temp.meses(a)::text;
  r := pg_temp.usar(u, cod_a);
  return query select 'um só código por conta', 'ja_usado', r;

  -- Médico → médico
  b := pg_temp.conta('teste-rec-b@example.com', 'physician');
  perform pg_temp.como(b);
  perform public.criar_espaco('individual', 'teste-rec-espaco-b', 'Dr. B', 'medico');
  execute 'reset role';
  r := pg_temp.usar(b, cod_a);
  return query select 'médico usa código de médico', 'ok', r;
  return query select 'antes do pagamento: nenhum mês', '0', (pg_temp.meses(a) + pg_temp.meses(b))::text;
  perform public.registar_primeiro_pagamento(b);
  return query select 'após pagamento: médico convidado ganha 1', '1', pg_temp.meses(b)::text;
  return query select 'após pagamento: médico que convidou ganha 1', '1', pg_temp.meses(a)::text;
  perform public.registar_primeiro_pagamento(b);
  return query select 'segundo pagamento não dá mais meses', '1', pg_temp.meses(b)::text;

  -- Utente → médico
  p2 := pg_temp.conta('teste-rec-p2@example.com', 'patient');
  perform pg_temp.como(p2);
  cod_p2 := public.meu_codigo_utente();
  execute 'reset role';
  c := pg_temp.conta('teste-rec-c@example.com', 'physician');
  r := pg_temp.usar(c, cod_p2);
  return query select 'médico usa código de utente', 'ok', r;
  perform public.registar_primeiro_pagamento(c);
  return query select 'médico ganha o 1.º mês', '1', pg_temp.meses(c)::text;
  return query select 'utente que recomendou não ganha', '0', pg_temp.meses(p2)::text;
  x := pg_temp.conta('teste-rec-p3@example.com', 'patient');
  r := pg_temp.usar(x, cod_p2);
  return query select 'utente não pode usar código de utente', 'nao_aplicavel', r;

  -- Conta repetida (mesmo email normalizado)
  dup := pg_temp.conta('teste.rec.a+2@gmail.com', 'physician');
  perform pg_temp.conta('testereca@gmail.com', 'physician');
  r := pg_temp.usar(dup, cod_a);
  return query select 'conta repetida é aceite mas anulada', 'anulado', (select estado from public.recomendacoes where convidado_id = dup);

  -- Limite de 12 por ano (A já tem 1)
  for i in 1..12 loop
    e := pg_temp.conta('teste-rec-lim' || i || '@example.com', 'physician');
    perform pg_temp.usar(e, cod_a);
    perform public.registar_primeiro_pagamento(e);
  end loop;
  return query select 'limite de 12 meses por ano respeitado', '12', pg_temp.meses(a)::text;
  return query select 'excedentes ficam como limite_atingido', '1',
    (select count(*) from public.meses_gratis where beneficiario_id = a and estado = 'limite_atingido')::text;

  -- Totais sem identidades
  perform pg_temp.como(a);
  resumo := public.resumo_recomendacoes();
  r := 'ok';
  begin
    perform 1 from public.recomendacoes limit 1;
    if found then r := 'vê linhas'; end if;
  exception when others then r := 'ok';
  end;
  execute 'reset role';
  return query select 'resumo: utentes pelo código', '1', resumo->>'utentes';
  return query select 'resumo: médicos (exclui anulados)', '13', resumo->>'medicos';
  return query select 'resumo: meses ganhos no ano', '12', resumo->>'meses_ano';
  return query select 'médico não lê recomendações diretamente', 'ok', r;

  perform pg_temp.como(a);
  begin
    perform public.registar_primeiro_pagamento(a);
    r := 'executou';
  exception when others then r := 'bloqueado';
  end;
  execute 'reset role';
  return query select 'utilizador não pode simular pagamento', 'bloqueado', r;

  delete from public.espacos where nome like 'teste-rec-%';
  delete from auth.users where email like 'teste-rec-%' or email like 'teste.rec.%' or email = 'testereca@gmail.com';
end $$;

select teste, esperado, obtido, esperado = obtido as ok from pg_temp.testes();
