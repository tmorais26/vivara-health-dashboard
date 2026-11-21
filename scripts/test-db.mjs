// Testa as regras do programa de recomendação na própria base de dados, com um
// Postgres em memória (PGlite). Corre a migração real, por isso o que passa aqui
// é o que corre no Supabase.
//
//   npm install --no-save @electric-sql/pglite && npm run test:db
//
// Se o PGlite não estiver instalado, o teste é saltado (não falha o CI).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let PGlite;
try {
  ({ PGlite } = await import("@electric-sql/pglite"));
} catch {
  console.log("test:db saltado (instale @electric-sql/pglite com --no-save para o correr)");
  process.exit(0);
}

const db = new PGlite();
// Peças mínimas do Supabase de que a migração depende.
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
`);
await db.exec(readFileSync("supabase/migrations/20261121150000_referral_program.sql", "utf8"));

let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { process.exitCode = 1; console.log(`  ✗ ${name}\n    ${e.message}`); }
};
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];
const user = async (email) => (await one("insert into auth.users (email) values ($1) returning id", [email])).id;
const codeOf = async (u, kind = "patient") => (await one("select public.ensure_referral_code($1,$2) as c", [u, kind])).c;
const register = async (code, ref, kind = "patient", h = null) =>
  (await one("select public.register_referral($1,$2,$3,$4) as r", [code, ref, kind, h])).r;
const pay = async (u, fp = null, year = 2026) =>
  q("select * from public.referral_on_first_payment($1,$2,$3)", [u, fp, year]);
const summary = async (u, year = 2026) => (await one("select public.referral_summary($1,$2) as s", [u, year])).s;

await test("código tem o formato VIV-XXXX-XXXX, sem 0/O/1/I/L", async () => {
  const a = await user("a@x.pt");
  const c = await codeOf(a);
  assert.match(c, /^VIV-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  for (let i = 0; i < 300; i++) {
    const { c: g } = await one("select public.gen_referral_code() as c");
    assert.match(g, /^VIV-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  }
});

await test("cada pessoa tem sempre o mesmo código e os códigos não se repetem", async () => {
  const a = await user("b@x.pt"), b = await user("c@x.pt");
  const ca = await codeOf(a);
  assert.equal(await codeOf(a), ca);
  assert.notEqual(await codeOf(b), ca);
});

await test("a distribuição dos símbolos é uniforme (sem enviesamento)", async () => {
  const rows = await q("select public.gen_referral_code() as c from generate_series(1, 3000)");
  const count = {};
  for (const { c } of rows) for (const ch of c.replace(/VIV|-/g, "")) count[ch] = (count[ch] ?? 0) + 1;
  const vals = Object.values(count);
  assert.equal(vals.length, 31);
  const mean = vals.reduce((s, v) => s + v, 0) / 31;
  for (const v of vals) assert.ok(Math.abs(v - mean) < mean * 0.25, `símbolo fora do esperado: ${v} vs ${mean}`);
});

await test("código inexistente e o próprio código são rejeitados", async () => {
  const a = await user("d@x.pt");
  const c = await codeOf(a);
  assert.equal(await register("VIV-2222-2222", a), "invalid_code");
  assert.equal(await register(c, a), "own_code");
});

await test("cada pessoa só pode usar UM código", async () => {
  const r1 = await user("e1@x.pt"), r2 = await user("e2@x.pt"), n = await user("e3@x.pt");
  assert.equal(await register(await codeOf(r1), n, "patient", "h-n"), "ok");
  assert.equal(await register(await codeOf(r2), n, "patient", "h-n"), "already_used");
});

await test("a mesma pessoa (email normalizado) não conta duas vezes para o mesmo convidante", async () => {
  const r = await user("f1@x.pt"), n1 = await user("f2@x.pt"), n2 = await user("f3@x.pt");
  const c = await codeOf(r);
  assert.equal(await register(c, n1, "patient", "mesmo-hash"), "ok");
  assert.equal(await register(c, n2, "patient", "mesmo-hash"), "duplicate_account");
});

await test("sem primeiro pagamento não há mês: só «pendente»", async () => {
  const r = await user("g1@x.pt"), n = await user("g2@x.pt");
  await register(await codeOf(r), n, "patient", "g2");
  const s = await summary(r);
  assert.equal(s.invited, 1); assert.equal(s.pending, 1); assert.equal(s.completed, 0); assert.equal(s.monthsThisYear, 0);
  assert.equal((await summary(n)).monthsThisYear, 0);
});

await test("utente recomenda utente: depois do 1.º pagamento os dois ganham 1 mês", async () => {
  const r = await user("h1@x.pt"), n = await user("h2@x.pt");
  await register(await codeOf(r), n, "patient", "h2");
  const given = await pay(n, "fp-h2");
  assert.equal(given.length, 2);
  assert.equal((await summary(r)).monthsThisYear, 1);
  assert.equal((await summary(n)).monthsThisYear, 1);
  const s = await summary(r);
  assert.equal(s.completed, 1); assert.equal(s.pending, 0);
});

await test("o mês só se atribui uma vez por recomendação (segundo pagamento não repete)", async () => {
  const r = await user("i1@x.pt"), n = await user("i2@x.pt");
  await register(await codeOf(r), n, "patient", "i2");
  await pay(n, "fp-i2");
  assert.equal((await pay(n, "fp-i2")).length, 0);
  assert.equal((await summary(r)).monthsThisYear, 1);
});

await test("utente recomenda médico: os dois ganham 1 mês", async () => {
  const p = await user("j1@x.pt"), d = await user("j2@x.pt");
  await register(await codeOf(p), d, "doctor", "j2");
  assert.equal((await pay(d, "fp-j2")).length, 2);
  assert.equal((await summary(p)).monthsThisYear, 1);
});

await test("médico recomenda utente: só o utente ganha", async () => {
  const d = await user("k1@x.pt"), p = await user("k2@x.pt");
  await register(await codeOf(d, "doctor"), p, "patient", "k2");
  const given = await pay(p, "fp-k2");
  assert.equal(given.length, 1);
  assert.equal(given[0].credit_role, "referee");
  assert.equal((await summary(d)).monthsThisYear, 0);
});

await test("meio de pagamento já usado por outra conta: não conta", async () => {
  const r = await user("l1@x.pt"), n = await user("l2@x.pt");
  await register(await codeOf(r), n, "patient", "l2");
  const outra = await user("l3@x.pt");                      // outra conta, sem recomendação
  assert.equal((await one("select public.record_payment_fingerprint($1,$2) as ok", [outra, "fp-partilhado"])).ok, true);
  assert.equal((await pay(n, "fp-partilhado")).length, 0);
  const s = await summary(r);
  assert.equal(s.monthsThisYear, 0);
  assert.equal(s.invited, 0, "rejeitadas não contam como convidados");
  assert.equal((await one("select status, reject_reason from public.referrals where referee_id = $1", [n])).reject_reason, "duplicate_payment_method");
});

await test("limite de 12 meses por ano civil, por pessoa", async () => {
  const r = await user("m1@x.pt");
  const c = await codeOf(r);
  for (let i = 0; i < 14; i++) {
    const n = await user(`m-n${i}@x.pt`);
    await register(c, n, "patient", `m-h${i}`);
    const given = await pay(n, `m-fp${i}`);
    // quem chega ganha sempre (tem a sua conta a 0); quem recomenda só até 12
    assert.equal(given.some((g) => g.credit_role === "referee"), true);
    assert.equal(given.some((g) => g.credit_role === "referrer"), i < 12, `recomendação ${i + 1}`);
  }
  const s = await summary(r);
  assert.equal(s.monthsThisYear, 12);
  assert.equal(s.completed, 14, "as 14 ficam concluídas, mas só 12 meses");
});

await test("o limite é por ano civil: em 2027 volta a contar de zero", async () => {
  const r = await user("n1@x.pt");
  const c = await codeOf(r);
  for (let i = 0; i < 12; i++) {
    const n = await user(`n-n${i}@x.pt`);
    await register(c, n, "patient", `n-h${i}`);
    await pay(n, `n-fp${i}`, 2026);
  }
  assert.equal((await summary(r, 2026)).monthsThisYear, 12);
  const n = await user("n-novo@x.pt");
  await register(c, n, "patient", "n-hnovo");
  assert.equal((await pay(n, "n-fpnovo", 2027)).filter((g) => g.credit_role === "referrer").length, 1);
  assert.equal((await summary(r, 2027)).monthsThisYear, 1);
});

await test("o resumo não revela identidades", async () => {
  const r = await user("o1@x.pt"), n = await user("o2@x.pt");
  await register(await codeOf(r), n, "patient", "o2");
  await pay(n, "fp-o2");
  const txt = JSON.stringify(await summary(r));
  assert.ok(!txt.includes(n), "o id do convidado aparece no resumo");
  assert.ok(!txt.includes("o2@x.pt"));
  assert.deepEqual(Object.keys(await summary(r)).sort(), ["completed", "credits", "invited", "monthsThisYear", "pending"]);
});

await test("o limite de pedidos corta à n+1 dentro da janela", async () => {
  for (let i = 0; i < 3; i++) assert.equal((await one("select public.rate_limit_hit('t', 3, interval '1 minute') as ok")).ok, true);
  assert.equal((await one("select public.rate_limit_hit('t', 3, interval '1 minute') as ok")).ok, false);
  assert.equal((await one("select public.rate_limit_hit('outro', 3, interval '1 minute') as ok")).ok, true);
});

await test("o telemóvel (anon/authenticated) não lê nem escreve nestas tabelas nem chama as funções", async () => {
  for (const role of ["anon", "authenticated"]) {
    for (const t of ["referral_codes", "referrals", "referral_credits", "payment_fingerprints", "rate_limit_hits"]) {
      for (const priv of ["select", "insert", "update", "delete"]) {
        assert.equal((await one("select has_table_privilege($1,$2,$3) as p", [role, `public.${t}`, priv])).p, false, `${role} ${priv} ${t}`);
      }
    }
    for (const f of ["ensure_referral_code(uuid,text)", "register_referral(text,uuid,text,text)", "referral_on_first_payment(uuid,text,int)", "record_payment_fingerprint(uuid,text)", "referral_summary(uuid,int)", "rate_limit_hit(text,int,interval)"]) {
      assert.equal((await one("select has_function_privilege($1,$2,'execute') as p", [role, `public.${f}`])).p, false, `${role} ${f}`);
    }
  }
});

console.log(`\n${passed} testes de base de dados passaram${process.exitCode ? " — HÁ FALHAS" : ""}`);
