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

console.log(`\n${passed} testes passaram${process.exitCode ? " — HÁ FALHAS" : ""}`);
