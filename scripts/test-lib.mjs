// Testes dos módulos que produzem números de saúde: leitura de análises e
// idade biológica. Correr com `npm run test:lib`.
//
// Todos os valores aqui são inventados, na estrutura dos documentos reais.
import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "vivara-test-"));
const bundle = async (entry, name) => {
  const out = join(dir, name);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external: ["pdfjs-dist"], outfile: out, logLevel: "silent" });
  return import(out);
};
const { parseLine, parseValues } = await bundle("src/lib/lab-parse.ts", "lab-parse.mjs");
const { phenoAge } = await bundle("src/lib/bioage.ts", "bioage.mjs");
const { answer } = await bundle("src/lib/assistant-rules.ts", "assistant.mjs");
const { searchConditions, CONDITION_LIST } = await bundle("src/lib/conditions.ts", "conditions.mjs");
const { monthGrid, dayKey, shiftMonth } = await bundle("src/lib/calendar.ts", "calendar.mjs");
const { validateSignup } = await bundle("src/lib/consent.validate.ts", "consent-validate.mjs");
const { SIGNUP_CHECKBOXES, DOC_VERSIONS } = await bundle("src/lib/consent.config.ts", "consent-config.mjs");

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.log(`  ✗ ${name}\n      ${e.message.split("\n")[0]}`); process.exitCode = 1; }
};
const one = (line) => parseLine(line);

console.log("Leitura de análises");
test("nome e valor na mesma linha", () => {
  const r = one("Glicose em jejum 98 mg/dL 70 - 99");
  assert.equal(r.marker, "Glicose"); assert.equal(r.value, "98"); assert.equal(r.ref, "70 – 99");
});
test("vírgula decimal", () => assert.equal(one("Hemoglobina 13,4 g/dL 12.0 - 15.5").value, "13.4"));
test("código de exame antes do nome não é lido como outro marcador", () => {
  const r = one("B12.4 Glicose 98 mg/dL 70 - 99");
  assert.equal(r.marker, "Glicose"); assert.equal(r.value, "98");
});
test("'Rácio Colesterol / HDL' não é lido como colesterol", () => assert.equal(one("Racio Colesterol total / HDL 3.5"), null));
test("a unidade desmente o nome: HbA1c não vira Hemoglobina", () => {
  const r = one("Hemoglobina A1c 5,7 % < 5.7");
  assert.equal(r.marker, "HbA1c"); assert.equal(r.value, "5.7");
});
test("'Hemoglobina Alc' com unidade de hemoglobina não é reconhecida", () => assert.equal(one("Hemoglobina Alc 5,7 g/dL"), null));
test("mU/L não é confundido com U/L", () => {
  const r = one("TSH 2,10 mU/L 0.55 - 4.78");
  assert.equal(r.marker, "TSH"); assert.equal(r.value, "2.10");
});
test("valor sem separador decimal fica marcado para confirmar", () => assert.equal(one("Hemoglobina Alc 57 % <57").suspect, true));
test("sinónimo com acento (Proteína C Reativa)", () => {
  const r = one("Proteína C Reativa 0,12 mg/dL < 0,50");
  assert.equal(r.marker, "PCR-us"); assert.equal(r.unit, "mg/dL");
});

console.log("Formato de duas linhas (Joaquim Chaves)");
const jc = parseValues([
  "Hemoglobina", "15,1 / 15,4", "15,3 g/dL 13,0-16,5",
  "Eritrócitos", "5,11 / 5,02", "5,20 x10^12/L 4,30-6,40",
  "Linfócitos", "3,1 [46,5] / 3,0 [44,7]", "3,0 [43,1] x10^9/L [%] 0,8-4,0",
  "Albumina", "66,6 [4,7] % [g/dL] 47,8-65,0 [3,4-4,8]",
  "Alfa-1-Globulina", "2,8 [0,2] % [g/dL] 2,7-6,3 [0,2-0,4]",
  "Imunoglobulina G - IgG", "1105 mg/dL 600-1600",
]);
const by = Object.fromEntries(jc.map((v) => [v.marker, v]));
test("salta os resultados anteriores e apanha o desta colheita", () => assert.equal(by["Hemoglobina"].value, "15.3"));
test("unidades x10^12/L", () => assert.equal(by["Eritrócitos"].unit, "x10^12/L"));
test("linfócitos absolutos, não a percentagem entre parênteses", () => assert.equal(by["Linfócitos"].value, "3.0"));
test("albumina em g/dL a partir do valor entre parênteses retos", () => {
  assert.equal(by["Albumina"].value, "4.7"); assert.equal(by["Albumina"].unit, "g/dL"); assert.equal(by["Albumina"].ref, "3.4 – 4.8");
});
test("as fracções da electroforese ficam em %", () => assert.equal(by["Alfa-1-Globulina"].unit, "%"));

console.log("Idade biológica (PhenoAge)");
// Referência independente pelo caminho longo do artigo, via mortality score.
const ref = (alb, creat, gluc, crp, lym, mcv, rdw, alp, wbc, age) => {
  const xb = -19.9067 - 0.0336 * alb + 0.0095 * creat + 0.1953 * gluc + 0.0954 * Math.log(crp) - 0.012 * lym + 0.0268 * mcv + 0.3306 * rdw + 0.00188 * alp + 0.0554 * wbc + 0.0804 * age;
  const M = 1 - Math.exp((-1.51714 * Math.exp(xb)) / 0.0076927);
  return 141.50225 + Math.log(-0.00553 * Math.log(1 - M)) / 0.090165;
};
const V = (rows) => rows.map(([name, value, unit]) => ({ name, value, unit }));
const panel = V([["Albumina", 4.4, "g/dL"], ["Creatinina", 0.82, "mg/dL"], ["Glicose", 98, "mg/dL"], ["PCR-us", 1.2, "mg/L"], ["Linfócitos", 2.0, "x10^9/L"], ["VGM", 88, "fL"], ["RDW", 13.1, "%"], ["Fosfatase alcalina", 68, "U/L"], ["Leucócitos", 6.2, "x10^9/L"]]);
test("coincide com a fórmula pelo caminho longo", () => {
  const r = phenoAge(panel, 47);
  assert.equal(r.status, "ok");
  assert.ok(Math.abs(r.age - ref(44, 0.82 * 88.4, 98 / 18.016, 0.12, (2.0 / 6.2) * 100, 88, 13.1, 68, 6.2, 47)) < 0.06);
});
test("perfil de risco dá idade biológica superior à real", () => {
  const r = phenoAge(V([["Albumina", 3.8, "g/dL"], ["Creatinina", 1.25, "mg/dL"], ["Glicose", 122, "mg/dL"], ["PCR-us", 9, "mg/L"], ["Linfócitos", 1.7, "x10^9/L"], ["VGM", 96, "fL"], ["RDW", 15.5, "%"], ["Fosfatase alcalina", 110, "U/L"], ["Leucócitos", 9.5, "x10^9/L"]]), 60);
  assert.ok(r.age > 60);
});
test("com marcadores em falta não calcula e diz quais faltam", () => {
  const r = phenoAge(V([["Albumina", 4.4, "g/dL"], ["Leucócitos", 6.2, "x10^9/L"]]), 40);
  assert.equal(r.status, "missing"); assert.ok(r.missing.includes("Creatinina") && !r.missing.includes("Albumina"));
});
test("unidade impossível não é calculada", () => {
  const bad = panel.map((v) => (v.name === "Creatinina" ? { ...v, value: 82 } : v)); // 82 mg/dL = 7249 µmol/L
  const r = phenoAge(bad, 47);
  assert.equal(r.status, "missing"); assert.deepEqual(r.invalid, ["Creatinina"]);
});
test("aceita as unidades do SI sem converter", () => {
  const si = V([["Albumina", 44, "g/L"], ["Creatinina", 72.5, "µmol/L"], ["Glicose", 5.44, "mmol/L"], ["PCR-us", 0.12, "mg/dL"], ["Linfócitos", 2.0, "x10^9/L"], ["VGM", 88, "fL"], ["RDW", 13.1, "%"], ["Fosfatase alcalina", 68, "U/L"], ["Leucócitos", 6.2, "x10^9/L"]]);
  assert.ok(Math.abs(phenoAge(si, 47).age - phenoAge(panel, 47).age) < 0.15);
});
test("idade fora do intervalo do modelo", () => assert.equal(phenoAge(panel, 17).status, "age"));

console.log("Assistente (sem modelo de linguagem)");
const facts = {
  today: "2026-04-27",
  appts: [
    { id: "c1", iso: "2026-05-12T14:30:00", titlePt: "Discussão sobre TRH", titleEn: "HRT discussion" },
    { id: "c2", iso: "2026-05-20T10:00:00", titlePt: "Colheita de sangue", titleEn: "Blood draw" },
    { id: "c0", iso: "2026-04-22T10:00:00", titlePt: "Revisão trimestral", titleEn: "Quarterly review" },
  ],
  reminders: [{ day: "2026-05-12", time: null, text: "levar a lista de medicação" }],
  docs: [
    { id: "d1", iso: "2026-04-22", lab: "Synlab", titlePt: "Painel completo", titleEn: "Full panel", markers: ["Estradiol", "ApoB"] },
    { id: "d2", iso: "2025-12-06", lab: "CUF", titlePt: "Painel completo", titleEn: "Full panel", markers: ["Estradiol"] },
  ],
  unread: [{ titlePt: "Análise nova", titleEn: "New lab result" }],
  supplements: [{ namePt: "Berberina 500 mg", nameEn: "Berberine 500 mg", whenPt: "19:00", whenEn: "7 pm" }],
  conditions: ["Hipotiroidismo"],
};
const ask = (q, lang = "pt") => answer(q, facts, lang);
test("próxima consulta diz quem marcou", () => {
  const r = ask("Quando é a minha próxima consulta?");
  assert.match(r.text, /12 mai 2026 às 14:30/); assert.match(r.text, /marcada pelo médico/); assert.doesNotMatch(r.text, /administrativ/);
});
test("última consulta", () => assert.match(ask("qual foi a última consulta").text, /22 abr 2026/));
test("exame de um ano sem documentos diz que não há e mostra os que há", () => {
  const r = ask("Mostra-me o meu exame de 2020");
  assert.match(r.text, /Não encontro nenhum exame de 2020/); assert.equal(r.actions.length, 2);
});
test("exame de um ano com documento abre o documento", () => {
  const r = ask("mostra o exame de 2025");
  assert.deepEqual(r.actions[0].to, { route: "documento", docId: "d2" });
});
test("marcador devolve o documento e não o valor", () => {
  const r = ask("Em que exames tenho o ApoB?");
  assert.match(r.text, /ApoB aparece/); assert.doesNotMatch(r.text, /\d+ mg/);
});
test("lembretes aparecem como do utente", () => assert.match(ask("os meus lembretes").text, /a clínica não os vê/));
test("novidades listam o que está por ler", () => assert.match(ask("o que há de novo?").text, /Análise nova/));
test("plano de hoje", () => assert.match(ask("que suplementos tomo hoje").text, /Berberina/));
test("condições registadas", () => assert.match(ask("que condições tenho").text, /Hipotiroidismo/));
for (const q of ["Como estão as minhas análises?", "O meu estradiol está baixo?", "Devo tomar mais magnésio?", "Isto é grave?", "o que significa HbA1c", "Está tudo normal?", "Is my result good?", "Should I worry?", "how are my results"]) {
  test(`recusa interpretação: «${q}»`, () => {
    const r = ask(q, /[a-z]/.test(q) && /should|good|how/.test(q) ? "en" : "pt");
    assert.match(r.text, /médico|doctor/); assert.equal(r.actions.length, 0);
  });
}
test("pergunta de consulta não é confundida com interpretação", () => assert.match(ask("when is my next appointment", "en").text, /12 May 2026/));
test("pergunta desconhecida devolve a ajuda", () => assert.match(ask("qual é a capital da França").text, /Posso ajudar/));

console.log("Condições e calendário");
test("pesquisa sem acentos e por prefixo", () => assert.equal(searchConditions("hipotir")[0].pt, "Hipotiroidismo"));
test("pesquisa em inglês", () => assert.ok(searchConditions("asthma").some((c) => c.pt === "Asma")));
test("sem resultados devolve vazio", () => assert.equal(searchConditions("zzzzqq").length, 0));
test("lista sem duplicados", () => assert.equal(new Set(CONDITION_LIST.map((c) => c[0])).size, CONDITION_LIST.length));
test("grelha do mês tem 42 dias e começa à segunda", () => {
  const g = monthGrid(2026, 4); // maio de 2026 começa a uma sexta
  assert.equal(g.length, 42); assert.equal(g[0].key, "2026-04-27"); assert.equal(g[4].key, "2026-05-01"); assert.equal(g[4].inMonth, true); assert.equal(g[0].inMonth, false);
});
test("chave do dia não depende do fuso", () => assert.equal(dayKey(new Date(2026, 4, 12, 23, 59)), "2026-05-12"));
test("mudar de mês passa o ano", () => assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, month: 0 }));

// ── Criar conta e consentimentos ──
const okSignup = {
  name: "Ana Teste", email: "Ana@Example.com ", password: "palavra-passe", invite: "",
  checks: { "signup-age": true, "signup-legal": true, "signup-health": true, "signup-marketing": false }, lang: "pt",
};
test("registo válido passa e normaliza o email", () => {
  const { input, errors } = validateSignup(okSignup);
  assert.deepEqual(errors, {});
  assert.equal(input.email, "ana@example.com");
});
test("as três caixas obrigatórias são exigidas, a de novidades não", () => {
  for (const id of ["signup-age", "signup-legal", "signup-health"]) {
    const { errors } = validateSignup({ ...okSignup, checks: { ...okSignup.checks, [id]: false } });
    assert.equal(errors[id], "required", id);
  }
  assert.deepEqual(validateSignup({ ...okSignup, checks: { ...okSignup.checks, "signup-marketing": true } }).errors, {});
});
test("caixas só contam se forem exatamente true", () => {
  const { errors } = validateSignup({ ...okSignup, checks: { "signup-age": "true", "signup-legal": 1, "signup-health": true } });
  assert.equal(errors["signup-age"], "required");
  assert.equal(errors["signup-legal"], "required");
});
test("email inválido, palavra-passe curta e nome vazio dão erro no campo", () => {
  const { errors } = validateSignup({ ...okSignup, name: "  ", email: "nao-e-email", password: "1234567" });
  assert.deepEqual(errors, { name: "required", email: "invalid", password: "too_short" });
});
test("código de convite só aceita letras, números e hífenes", () => {
  assert.equal(validateSignup({ ...okSignup, invite: "<script>" }).errors.invite, "invalid");
  assert.deepEqual(validateSignup({ ...okSignup, invite: "VIVARA-2026" }).errors, {});
});
test("texto das caixas é o aprovado (PT)", () => {
  const pt = Object.fromEntries(SIGNUP_CHECKBOXES.map((c) => [c.id, c.text.pt]));
  assert.equal(pt["signup-age"], "Tenho 18 anos ou mais.");
  assert.equal(pt["signup-legal"], "Li e aceito os Termos de Serviço e tomei conhecimento da Política de Privacidade.");
  assert.equal(pt["signup-health"], "Dou o meu consentimento explícito para a Vivara tratar os meus dados de saúde (análises, exames e registos que carregar) para me prestar o serviço. Posso retirar o consentimento a qualquer momento.");
  assert.equal(pt["signup-marketing"], "Quero receber novidades da Vivara por email.");
  assert.deepEqual(SIGNUP_CHECKBOXES.map((c) => c.required), [true, true, true, false]);
  assert.deepEqual(DOC_VERSIONS, { terms: "termos-v1", privacy: "privacidade-v1" });
});

console.log(`\n${passed} testes passaram${process.exitCode ? " — HÁ FALHAS" : ""}`);
