// Testa na base de dados as regras da orientação nutricional (versões, pedido
// de validação, quem pode validar, auditoria), com um Postgres em memória
// (PGlite) e a migração real. As tabelas do portal são simuladas.
//
//   npm install --no-save @electric-sql/pglite && npm run test:db
//
// Sem o PGlite instalado, o teste é saltado (não falha o CI).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let PGlite;
try { ({ PGlite } = await import("@electric-sql/pglite")); }
catch { console.log("test:db saltado (instale @electric-sql/pglite com --no-save para o correr)"); process.exit(0); }

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  -- auth.uid() lê o utilizador "com sessão" de uma variável da ligação
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  -- peças do portal e da app de que a migração depende
  create table public.profiles (id uuid primary key, role text, full_name text);
  create table public.medico_perfis (user_id uuid primary key, nome text);
  create table public.membros (id uuid primary key default gen_random_uuid(), user_id uuid, nome_exibicao text, criado_em timestamptz default now());
  create table public.recomendacoes (id uuid primary key default gen_random_uuid(), convidante_id uuid, convidante_tipo text, convidado_id uuid, estado text);
  create table public.convites_app (token uuid primary key default gen_random_uuid(), convidante_id uuid, utente_id uuid, usado_por uuid);
  create table public.consent_events (id bigint generated always as identity, user_id uuid, consent_type text, action text,
    constraint consent_events_consent_type_check check (consent_type ~ '^(age_18|terms)$'));
`);
await db.exec(readFileSync("supabase/migrations/20261127120000_nutrition_guidance.sql", "utf8"));

let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { process.exitCode = 1; console.log(`  ✗ ${name}\n    ${e.message}`); }
};
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const one = async (sql, p) => (await q(sql, p))[0];
const user = async (email) => (await one("insert into auth.users (email) values ($1) returning id", [email])).id;
const as = async (uid) => db.query(`select set_config('test.uid', $1, false)`, [uid ?? ""]);
const versao = async (u, n, estado = "gerado", conteudo = { itens: [{ tipo: "privilegiar", alimento: "Leguminosas", marcador: "LDL-C", porque: "x" }], nota: "n" }) =>
  (await one(`insert into public.orientacoes_nutricionais (user_id, versao, estado, conteudo, entrada, entrada_hash)
     values ($1,$2,$3,$4,'{}','h') returning id`, [u, n, estado, JSON.stringify(conteudo)])).id;

const utente = await user("u@x.pt");
const medico = await user("m@x.pt");
const outroMedico = await user("o@x.pt");
const semLigacao = await user("s@x.pt");
await q("insert into public.profiles values ($1,'patient','Ana Teste'),($2,'physician','Médico Teste')", [utente, medico]);
await q("insert into public.medico_perfis values ($1,'Dra. Ana Costa')", [medico]);
await q("insert into public.recomendacoes (convidante_id, convidante_tipo, convidado_id, estado) values ($1,'profissional',$2,'registado')", [medico, utente]);

await test("o registo de consentimentos aceita o tipo ai_nutricao", async () => {
  await q("insert into public.consent_events (user_id, consent_type, action) values ($1,'ai_nutricao','granted')", [utente]);
});

await test("o conteúdo gerado e a entrada de uma versão não se alteram", async () => {
  const v = await versao(utente, 1);
  await assert.rejects(q("update public.orientacoes_nutricionais set conteudo = '{}' where id = $1", [v]));
  await assert.rejects(q("update public.orientacoes_nutricionais set entrada = '{\"x\":1}' where id = $1", [v]));
});

await test("utente sem profissional ligado: pedido recusado com 'sem_profissional'", async () => {
  const v = await versao(semLigacao, 1);
  await as(semLigacao);
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [v])).r, "sem_profissional");
});

await test("não se pode pedir validação de uma orientação de outra pessoa", async () => {
  const v = await versao(utente, 2);
  await as(semLigacao);
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [v])).r, "nao_encontrada");
});

let v3;
await test("pedir validação: fica 'em_validacao', um só pedido pendente, auditado", async () => {
  v3 = await versao(utente, 3);
  await as(utente);
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [v3])).r, "ok");
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [v3])).r, "ja_pedido");
  assert.equal((await one("select estado from public.orientacoes_nutricionais where id=$1", [v3])).estado, "em_validacao");
  assert.equal((await one("select count(*)::int n from public.orientacoes_auditoria where orientacao_id=$1 and acao='validacao_pedida'", [v3])).n, 1);
});

await test("a fila só mostra os pedidos dos utentes ligados a quem a pede", async () => {
  await as(medico);
  const fila = await q("select * from public.fila_validacao_nutricao()");
  assert.equal(fila.length, 1); assert.equal(fila[0].orientacao_id, v3); assert.equal(fila[0].utente_nome, "Ana Teste");
  await as(outroMedico);
  assert.equal((await q("select * from public.fila_validacao_nutricao()")).length, 0);
});

await test("um profissional não ligado não pode validar", async () => {
  await as(outroMedico);
  const c = { itens: [{ tipo: "reduzir", alimento: "Charcutaria", marcador: "LDL-C", porque: "x" }], nota: "" };
  assert.equal((await one("select public.validar_orientacao_nutricional($1,$2,null) as r", [v3, JSON.stringify(c)])).r, "sem_permissao");
});

await test("conteúdo inválido é recusado", async () => {
  await as(medico);
  for (const bad of [{ itens: [] }, { itens: [{ tipo: "outro", alimento: "x" }] }, { nota: "sem itens" }]) {
    assert.equal((await one("select public.validar_orientacao_nutricional($1,$2,null) as r", [v3, JSON.stringify(bad)])).r, "conteudo_invalido");
  }
});

await test("validar com edição: guarda a versão revista, o nome, a data, e o original fica intacto", async () => {
  await as(medico);
  const editado = { itens: [{ tipo: "privilegiar", alimento: "Leguminosas 3x por semana", marcador: "LDL-C", porque: "fibra" }], nota: "Revisto." };
  assert.equal((await one("select public.validar_orientacao_nutricional($1,$2,'ok') as r", [v3, JSON.stringify(editado)])).r, "ok");
  const o = await one("select * from public.orientacoes_nutricionais where id=$1", [v3]);
  assert.equal(o.estado, "validado"); assert.equal(o.editado, true); assert.equal(o.validado_por_nome, "Dra. Ana Costa");
  assert.ok(o.validado_em); assert.equal(o.conteudo.itens[0].alimento, "Leguminosas");
  assert.equal((await one("select estado from public.pedidos_validacao_nutricao where orientacao_id=$1", [v3])).estado, "concluido");
  assert.equal((await one("select acao from public.orientacoes_auditoria where orientacao_id=$1 order by id desc limit 1", [v3])).acao, "editado");
});

await test("sem pedido pendente não se valida; versão validada não aceita novo pedido", async () => {
  await as(medico);
  const c = { itens: [{ tipo: "reduzir", alimento: "Açúcar", marcador: "HbA1c", porque: "x" }], nota: "" };
  assert.equal((await one("select public.validar_orientacao_nutricional($1,$2,null) as r", [v3, JSON.stringify(c)])).r, "sem_pedido");
  await as(utente);
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [v3])).r, "ja_validada");
});

await test("versão bloqueada: o profissional escreve e valida a orientação", async () => {
  const vb = await versao(utente, 4, "bloqueado", { motivos: [{ kind: "critical", marker: "HbA1c" }] });
  await as(utente);
  assert.equal((await one("select public.pedir_validacao_nutricao($1) as r", [vb])).r, "ok");
  assert.equal((await one("select estado from public.orientacoes_nutricionais where id=$1", [vb])).estado, "bloqueado");
  await as(medico);
  const c = { itens: [{ tipo: "privilegiar", alimento: "Legumes", marcador: "HbA1c", porque: "x" }], nota: "" };
  assert.equal((await one("select public.validar_orientacao_nutricional($1,$2,null) as r", [vb, JSON.stringify(c)])).r, "ok");
});

await test("ligação por convite do portal também conta", async () => {
  const u2 = await user("u2@x.pt");
  await q("insert into public.convites_app (convidante_id, utente_id, usado_por) values ($1, gen_random_uuid(), $2)", [outroMedico, u2]);
  assert.equal((await one("select public.e_profissional_do_utente($1,$2) as r", [outroMedico, u2])).r, true);
});

await test("a auditoria não se altera nem se apaga", async () => {
  await assert.rejects(q("update public.orientacoes_auditoria set acao='gerado'"));
  await assert.rejects(q("delete from public.orientacoes_auditoria"));
});

await test("o telemóvel não escreve nas tabelas nem chama as funções internas", async () => {
  for (const t of ["orientacoes_nutricionais", "pedidos_validacao_nutricao", "orientacoes_auditoria"]) {
    for (const priv of ["insert", "update", "delete"]) {
      assert.equal((await one("select has_table_privilege('authenticated',$1,$2) as p", [`public.${t}`, priv])).p, false, `${priv} ${t}`);
    }
  }
  assert.equal((await one("select has_table_privilege('authenticated','public.orientacoes_auditoria','select') as p")).p, false);
  for (const f of ["e_profissional_do_utente(uuid,uuid)", "tem_profissional_ligado(uuid)"]) {
    assert.equal((await one("select has_function_privilege('authenticated',$1,'execute') as p", [`public.${f}`])).p, false, f);
  }
  for (const f of ["pedir_validacao_nutricao(uuid)", "fila_validacao_nutricao()", "validar_orientacao_nutricional(uuid,jsonb,text)"]) {
    assert.equal((await one("select has_function_privilege('anon',$1,'execute') as p", [`public.${f}`])).p, false, f);
  }
});

console.log(`\n${passed} testes de base de dados passaram${process.exitCode ? " — HÁ FALHAS" : ""}`);
