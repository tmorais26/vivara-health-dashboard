// Leitura de análises a partir de um PDF, inteiramente no dispositivo.
//
// O ficheiro nunca sai do browser: é lido para um ArrayBuffer, o pdf.js extrai
// o texto, e o resultado fica em localStorage/IndexedDB. Não há pedido de rede
// em lado nenhum deste módulo.
//
// Só lê PDFs com camada de texto (o que os laboratórios emitem por via
// digital). PDFs que são uma fotografia da folha não têm texto para extrair —
// isso precisaria de OCR de imagem, que é outra ordem de grandeza e fica de
// fora deliberadamente: mais vale dizer que não dá do que inventar valores.

export interface ParsedValue {
  marker: string | null; // nome canónico do marcador, quando reconhecido
  label: string;         // como apareceu no documento
  raw: string;           // linha original completa
  value: string;
  unit: string;
  ref: string;
  keep: boolean;
  suspect: boolean; // valor fora do fisicamente possível — pede confirmação
}

export interface ExtractedDoc {
  lines: string[];
  pages: number;
  lab: string | null;
  collectedISO: string | null;
}

// Nomes alternativos usados pelos laboratórios para o mesmo marcador. A lista
// é conservadora de propósito: um falso positivo aqui grava um valor errado no
// historial, portanto quando há dúvida prefere-se não reconhecer e deixar a
// linha para revisão manual.
// `units` é a defesa contra confusões de nome. "Hemoglobina A1c 5,7 %" seria
// apanhado pelo alias "hemoglobina" — sobretudo quando o OCR lê "A1c" como
// "Alc" e o alias longo falha — e gravava 5,7 como hemoglobina, além de
// ocupar o lugar da hemoglobina verdadeira. Como a hemoglobina vem em g/dL e
// nunca em %, a unidade desmente o nome e o candidato é descartado.
// `plaus` são limites de plausibilidade física, não julgamento clínico: servem
// para apanhar o erro de OCR que come o separador decimal — "5,7" lido como
// "57" num HbA1c é 10× e nenhuma regra de nomes o deteta. O valor não é
// rejeitado, é marcado para confirmação no ecrã de revisão.
const MARKER_ALIASES: { marker: string; aliases: string[]; units?: string[]; plaus?: [number, number] }[] = [
  { marker: "Estradiol",         aliases: ["estradiol", "estradiol (e2)", "17-beta-estradiol", "17 beta estradiol", "e2"], units: ["pg/mL"], plaus: [1,3000] },
  { marker: "FSH",               aliases: ["fsh", "hormona folículo estimulante", "hormona foliculo estimulante"] },
  { marker: "LH",                aliases: ["lh", "hormona luteinizante"] },
  { marker: "Progesterona",      aliases: ["progesterona"] },
  { marker: "Testosterona total", aliases: ["testosterona total", "testosterona"] },
  { marker: "SHBG",              aliases: ["shbg", "globulina de ligacao"] },
  { marker: "DHEA-S",            aliases: ["dhea-s", "dhea s", "sulfato de dheas", "dheas"] },
  { marker: "Cortisol matinal",  aliases: ["cortisol matinal", "cortisol"] },
  { marker: "Prolactina",        aliases: ["prolactina"], units: ["ng/mL"] },
  { marker: "AMH",               aliases: ["amh", "hormona anti-mulleriana", "hormona anti mulleriana"] },
  { marker: "ApoB",              aliases: ["apolipoproteina b", "apolipoproteína b", "apo b", "apob"], units: ["mg/dL"], plaus: [20,300] },
  { marker: "Apo A1",            aliases: ["apolipoproteina a1", "apolipoproteína a1", "apo a1", "apoa1"], units: ["mg/dL"] },
  { marker: "LDL-C",             aliases: ["colesterol ldl", "ldl colesterol", "c-ldl", "ldl-c", "ldl"], units: ["mg/dL"], plaus: [10,400] },
  { marker: "HDL-C",             aliases: ["colesterol hdl", "hdl colesterol", "c-hdl", "hdl-c", "hdl"], units: ["mg/dL"], plaus: [10,150] },
  { marker: "Colesterol total",  aliases: ["colesterol total", "colesterol, total"], units: ["mg/dL"], plaus: [50,500] },
  { marker: "Triglicéridos",     aliases: ["triglicerideos", "triglicéridos", "trigliceridos", "triglicerides"], units: ["mg/dL"], plaus: [20,2000] },
  { marker: "Lp(a)",             aliases: ["lipoproteina (a)", "lipoproteína (a)", "lp(a)", "lpa"] },
  // "alc"/"hbalc" são o 1 lido como l pelo OCR. Só são seguros porque a
  // unidade (%) desmente qualquer confusão com a hemoglobina, em g/dL.
  { marker: "HbA1c",             aliases: ["hemoglobina a1c", "hemoglobina alc", "hemoglobina glicada", "hemoglobina glicosilada", "hba1c", "hbalc", "a1c"], units: ["%"], plaus: [3,20] },
  { marker: "Glicose",           aliases: ["glicose jejum", "glicose em jejum", "glicemia jejum", "glicose", "glicemia"], units: ["mg/dL"], plaus: [20,800] },
  { marker: "Insulina",          aliases: ["insulina"], units: ["µU/mL","uU/mL"], plaus: [0.5,300] },
  { marker: "HOMA-IR",           aliases: ["homa-ir", "homa ir", "indice homa", "índice homa"] },
  { marker: "Peptídeo C",        aliases: ["peptideo c", "peptídeo c", "peptido c"] },
  { marker: "TSH",               aliases: ["tsh", "tirotropina"], units: ["mUI/L","mU/L","mU/mL","µU/mL","uU/mL"], plaus: [0.01,100] },
  { marker: "T4 livre",          aliases: ["t4 livre", "tiroxina livre", "ft4"], plaus: [0.1,8] },
  { marker: "T3 livre",          aliases: ["t3 livre", "triiodotironina livre", "ft3"], plaus: [0.5,20] },
  { marker: "Anti-TPO",          aliases: ["anti-tpo", "anti tpo", "anticorpos anti-peroxidase"] },
  { marker: "PCR-us",            aliases: ["pcr ultrassensivel", "pcr ultra-sensivel", "proteina c reactiva ultrassensivel", "pcr us", "pcr-as", "proteina c reactiva", "proteína c reativa"], units: ["mg/L"], plaus: [0.01,300] },
  { marker: "Homocisteína",      aliases: ["homocisteina", "homocisteína"], units: ["µmol/L","umol/L"], plaus: [1,100] },
  { marker: "Fibrinogénio",      aliases: ["fibrinogenio", "fibrinogénio"] },
  { marker: "Ácido úrico",       aliases: ["acido urico", "ácido úrico"], units: ["mg/dL"], plaus: [1,20] },
  { marker: "Vitamina D",        aliases: ["25-oh vitamina d", "25 oh vitamina d", "vitamina d 25 oh", "25-hidroxivitamina d", "vitamina d3", "vitamina d"], units: ["ng/mL"], plaus: [1,200] },
  { marker: "Vitamina B12",      aliases: ["vitamina b12", "cobalamina", "b12"], units: ["pg/mL"] },
  { marker: "Folato",            aliases: ["folato", "acido folico", "ácido fólico"] },
  { marker: "Ferritina",         aliases: ["ferritina"], units: ["ng/mL"], plaus: [1,3000] },
  { marker: "Ferro sérico",      aliases: ["ferro serico", "ferro sérico", "ferro"] },
  { marker: "Transferrina",      aliases: ["transferrina"] },
  { marker: "Magnésio",          aliases: ["magnesio", "magnésio"], units: ["mg/dL"], plaus: [0.5,5] },
  { marker: "Zinco",             aliases: ["zinco"] },
  { marker: "Selénio",           aliases: ["selenio", "selénio"] },
  { marker: "Cálcio",            aliases: ["calcio", "cálcio"], units: ["mg/dL"], plaus: [5,15] },
  { marker: "PTH",               aliases: ["pth", "paratormona"] },
  { marker: "Fósforo",           aliases: ["fosforo", "fósforo"], units: ["mg/dL"], plaus: [1,10] },
  { marker: "ALT",               aliases: ["alt", "tgp", "alanina aminotransferase"], units: ["U/L"] },
  { marker: "AST",               aliases: ["ast", "tgo", "aspartato aminotransferase"], units: ["U/L"] },
  { marker: "GGT",               aliases: ["ggt", "gama gt", "gama-gt"], units: ["U/L"] },
  { marker: "Fosfatase alcalina", aliases: ["fosfatase alcalina"], units: ["U/L"] },
  { marker: "Bilirrubina total", aliases: ["bilirrubina total"], units: ["mg/dL"], plaus: [0.05,20] },
  { marker: "Albumina",          aliases: ["albumina"], units: ["g/dL"], plaus: [1,7] },
  { marker: "Proteína total",    aliases: ["proteinas totais", "proteínas totais", "proteína total", "proteinas total"], units: ["g/dL"], plaus: [3,12] },
  { marker: "Creatinina",        aliases: ["creatinina"], units: ["mg/dL"], plaus: [0.1,15] },
  { marker: "TFG estimada",      aliases: ["tfg", "taxa de filtracao glomerular", "egfr"] },
  { marker: "Ureia",             aliases: ["ureia"], units: ["mg/dL"] },
  { marker: "Cistatina C",       aliases: ["cistatina c"] },
  { marker: "Hemoglobina",       aliases: ["hemoglobina"], units: ["g/dL"], plaus: [3,25] },
  { marker: "Hematócrito",       aliases: ["hematocrito", "hematócrito"], units: ["%"], plaus: [10,65] },
  { marker: "Eritrócitos",       aliases: ["eritrocitos", "eritrócitos", "globulos vermelhos", "eritrograma"], units: ["x10^12/L","10^12/L"] },
  { marker: "VGM",               aliases: ["vgm", "volume globular medio", "volume globular médio"], units: ["fL"] },
  { marker: "HGM",               aliases: ["hgm", "hemoglobina globular media", "hemoglobina globular média"], units: ["pg"] },
  { marker: "RDW",               aliases: ["rdw", "indice de dispersao eritrocitaria", "índice de dispersão eritrocitária"], units: ["%"] },
  { marker: "Leucócitos",        aliases: ["leucocitos", "leucócitos", "globulos brancos"], units: ["10^9/L","x10^9/L","10^3/µL","10*9/L"] },
  { marker: "Neutrófilos",       aliases: ["neutrofilos", "neutrófilos"], units: ["x10^9/L","10^9/L"] },
  { marker: "Linfócitos",        aliases: ["linfocitos", "linfócitos"], units: ["x10^9/L","10^9/L"] },
  { marker: "Plaquetas",         aliases: ["plaquetas"], units: ["10^9/L","x10^9/L","10^3/µL","10*9/L"] },
  { marker: "Eosinófilos",       aliases: ["eosinofilos", "eosinófilos"], units: ["x10^9/L","10^9/L"] },
  // Parâmetros que a Joaquim Chaves reporta e não existiam no painel.
  { marker: "CHGM",              aliases: ["concentracao de hemoglobina globular media", "concentração de hemoglobina globular média", "chgm"], units: ["g/dL"] },
  { marker: "Monócitos",         aliases: ["monocitos", "monócitos"], units: ["x10^9/L","10^9/L"] },
  { marker: "Basófilos",         aliases: ["basofilos", "basófilos"], units: ["x10^9/L","10^9/L"] },
  { marker: "Plaquetócrito",     aliases: ["plaquetocrito", "plaquetócrito"], units: ["%"] },
  { marker: "VPM",               aliases: ["volume plaquetario medio", "volume plaquetário médio", "vpm"], units: ["fL"] },
  { marker: "IgA",               aliases: ["imunoglobulina a - iga", "imunoglobulina a", "iga"], units: ["mg/dL"] },
  { marker: "IgG",               aliases: ["imunoglobulina g - igg", "imunoglobulina g", "igg"], units: ["mg/dL"] },
  { marker: "IgM",               aliases: ["imunoglobulina m - igm", "imunoglobulina m", "igm"], units: ["mg/dL"] },
  { marker: "IgE total",         aliases: ["imunoglobulina e, ige total", "imunoglobulina e - ige total", "ige total"], units: ["KU/L"] },
  { marker: "Alfa-1-Globulina",  aliases: ["alfa-1-globulina", "alfa 1 globulina"], units: ["%","g/dL"] },
  { marker: "Alfa-2-Globulina",  aliases: ["alfa-2-globulina", "alfa 2 globulina"], units: ["%","g/dL"] },
  { marker: "Beta-Globulina",    aliases: ["beta-globulina", "beta globulina"], units: ["%","g/dL"] },
  { marker: "Gama-Globulina",    aliases: ["gama-globulina", "gama globulina"], units: ["%","g/dL"] },
];

const LABS = ["Synlab", "CUF", "Joaquim Chaves", "Germano de Sousa", "Unilabs", "Labeto", "Beatriz Godinho"];

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

// Unidades aceites. Serve para não confundir o número do valor com números que
// aparecem noutras colunas (datas, códigos de exame, intervalos).
// A lookbehind impede que "U/L" seja apanhado dentro de "mU/L": sem ela, um
// TSH lido pelo OCR como "mU/L" ficava com unidade "U/L", incompatível com o
// marcador, e o valor era descartado por engano.
const UNIT_RE = /(?<![A-Za-zµ])(x?10\^?12\/L|x?10\^?9\/L|x?10\*9\/L|KUA\/L|KU\/L|mU\/mL|mU\/L|mg\/dL|g\/dL|µg\/dL|ug\/dL|ng\/mL|pg\/mL|µU\/mL|uU\/mL|mUI\/mL|mUI\/L|UI\/mL|U\/L|µmol\/L|umol\/L|mmol\/L|nmol\/L|mg\/L|µg\/L|ug\/L|ng\/dL|10\^?[369]\/L|10\^?12\/L|mL\/min[^\s]*|fL|pg|%|mm\/h|mg\/g)/i;

function parseNumber(tok: string): string | null {
  // Aceita "5.7" e "5,7"; rejeita anos e códigos longos.
  const m = tok.match(/^-?\d{1,6}(?:[.,]\d{1,3})?$/);
  if (!m) return null;
  return tok.replace(",", ".");
}

// Intervalo de referência impresso na folha: [60 - 150], (60-150), 60 – 150,
// < 1.0, > 40, ≤ 80.
function extractRef(after: string): string {
  const range = after.match(/[[(]?\s*(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*[\])]?/);
  if (range) return `${range[1].replace(",", ".")} – ${range[2].replace(",", ".")}`;
  const bound = after.match(/([<>≤≥]\s*\d+(?:[.,]\d+)?)/);
  if (bound) return bound[1].replace(",", ".").replace(/\s+/g, " ");
  return "";
}

interface Candidate { marker: string; alias: string; at: number; units?: string[]; plaus?: [number, number] }

// Reconhecimento do nome, separado da extracção do valor: há laboratórios
// (Joaquim Chaves, por exemplo) que imprimem o nome do parâmetro numa linha e
// o resultado na linha seguinte, depois de uma fila de pontos. Nesses casos é
// preciso saber que a linha nomeia um marcador antes de haver valor nenhum.
function findCandidates(line: string): { clean: string; viable: Candidate[] } {
  const clean = line.replace(/\.{3,}/g, " ").replace(/[.\-–—_]{4,}/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length < 3) return { clean, viable: [] };
  const n = norm(clean);

  // Escolhe o alias mais longo que abra a linha, para "colesterol total" não
  // ser capturado por "colesterol".
  //
  // Alguns laboratórios (Joaquim Chaves, entre outros) imprimem um código de
  // exame antes do nome — "B12.4 Glicose 98 mg/dL". Aceitam-se esses códigos
  // antes do nome, mas só se cada palavra do prefixo tiver algum dígito: assim
  // "B12.4 " passa e "Rácio Colesterol / " não, evitando apanhar um nome de
  // parâmetro que na verdade faz parte do nome de outro.
  const prefixIsCode = (prefix: string) =>
    prefix.trim() === "" ||
    (prefix.length <= 14 && prefix.trim().split(/\s+/).every((tok) => /\d/.test(tok)));

  // O alias tem de acabar em fronteira de palavra. Sem isto, o código de exame
  // "B12.4" seria lido como o marcador "B12" e o 98 da glicose entrava no
  // historial como vitamina B12.
  const endsAtBoundary = (idx: number, alias: string) => {
    const after = n[idx + alias.length];
    return after === undefined || /[\s:;)\]]/.test(after);
  };

  // Todos os candidatos, do alias mais longo para o mais curto. Testam-se por
  // ordem e fica o primeiro que produza um valor com unidade compatível — em
  // vez de eleger um vencedor à partida e desistir se ele não servir.
  const candidates: Candidate[] = [];
  for (const entry of MARKER_ALIASES) {
    for (const alias of entry.aliases) {
      const idx = n.indexOf(alias);
      if (idx < 0) continue;
      if (!prefixIsCode(n.slice(0, idx))) continue;
      if (!endsAtBoundary(idx, alias)) continue;
      candidates.push({ marker: entry.marker, alias, at: idx, units: entry.units, plaus: entry.plaus });
    }
  }
  if (candidates.length === 0) return { clean, viable: [] };
  candidates.sort((a, b) => b.alias.length - a.alias.length);

  // Se um alias é apenas o começo de outro mais longo que também encaixou no
  // mesmo sítio, o documento está a falar do parâmetro de nome longo. Descarta-
  // -se o curto em vez de o guardar como alternativa: numa linha "Hemoglobina
  // A1c", "Hemoglobina" não é uma segunda hipótese — é metade de outro nome.
  const truncated = candidates.filter((c) =>
    candidates.some(
      (o) => o.marker !== c.marker && o.at === c.at && o.alias.length > c.alias.length && o.alias.startsWith(c.alias),
    ),
  );
  return { clean, viable: candidates.filter((c) => !truncated.includes(c)) };
}

const unitKey = (u: string) => u.toLowerCase().replace(/[^a-z0-9]/g, "");

// Extrai valor, unidade e intervalo de um pedaço de texto à direita do nome —
// ou de uma linha inteira, quando o resultado vem separado do nome.
function readValue(tail: string, cand: Candidate): { value: string; unit: string; ref: string } | null {
  const tokens = tail.split(/\s+/).filter(Boolean);
  let value: string | null = null;
  let valueIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const num = parseNumber(tokens[i]);
    if (num != null) { value = num; valueIdx = i; break; }
  }
  if (value == null) return null;

  const after = tokens.slice(valueIdx + 1).join(" ");
  const unitMatch = after.match(UNIT_RE);
  const unit = unitMatch ? unitMatch[1] : "";

  // Unidade presente e incompatível com o marcador: o nome enganou-se.
  if (unit && cand.units && !cand.units.some((u) => unitKey(u) === unitKey(unit))) return null;

  const ref = extractRef(unit ? after.slice(after.indexOf(unit) + unit.length) : after);
  return { value, unit, ref };
}

function build(cand: Candidate, clean: string, raw: string, v: { value: string; unit: string; ref: string }): ParsedValue {
  const num = Number(v.value);
  return {
    marker: cand.marker,
    label: clean.slice(cand.at, cand.at + cand.alias.length).trim(),
    raw: raw.trim(),
    value: v.value,
    unit: v.unit,
    ref: v.ref,
    keep: true,
    suspect: !!cand.plaus && (num < cand.plaus[0] || num > cand.plaus[1]),
  };
}

export function parseLine(line: string): ParsedValue | null {
  const { clean, viable } = findCandidates(line);
  for (const cand of viable) {
    const v = readValue(clean.slice(cand.at + cand.alias.length), cand);
    if (v) return build(cand, clean, line, v);
  }
  return null;
}

export function parseValues(lines: string[]): ParsedValue[] {
  const out: ParsedValue[] = [];
  const seen = new Set<string>();

  const take = (v: ParsedValue | null) => {
    if (!v || !v.marker) return false;
    // Uma folha repete o nome do parâmetro no cabeçalho e no rodapé; fica o
    // primeiro reconhecido, que é o da tabela de resultados.
    if (seen.has(v.marker)) return false;
    seen.add(v.marker);
    out.push(v);
    return true;
  };

  for (let i = 0; i < lines.length; i++) {
    if (take(parseLine(lines[i]))) continue;

    // Nome reconhecido mas sem valor na própria linha: o resultado está nas
    // linhas seguintes. Exige-se que a linha do valor traga unidade — assim
    // salta-se por cima da coluna de "Resultados Anteriores", que é só números
    // soltos, e apanha-se a linha do resultado desta colheita.
    const { clean, viable } = findCandidates(lines[i]);
    if (viable.length === 0) continue;
    const hasOwnValue = viable.some((c) => readValue(clean.slice(c.at + c.alias.length), c));
    if (hasOwnValue) continue;

    for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
      // Se a linha seguinte já nomeia outro parâmetro, este ficou sem valor.
      if (findCandidates(lines[j]).viable.length > 0 && parseLine(lines[j])) break;
      let matched = false;
      for (const cand of viable) {
        const v = readValue(lines[j], cand);
        if (v && v.unit) { matched = take(build(cand, clean, `${lines[i]} ⏎ ${lines[j]}`, v)); break; }
      }
      if (matched) break;
    }
  }
  return out;
}

// Laboratório e data de colheita, a partir das primeiras linhas. Exposto
// separadamente porque o texto pode vir do PDF ou do OCR de uma imagem, e a
// detecção é a mesma nos dois casos.
export function detectFromLines(lines: string[]): { lab: string | null; collectedISO: string | null } {
  return { lab: detectLab(lines), collectedISO: detectDate(lines) };
}

function detectLab(lines: string[]): string | null {
  const head = norm(lines.slice(0, 25).join(" "));
  return LABS.find((l) => head.includes(norm(l))) ?? null;
}

function detectDate(lines: string[]): string | null {
  const head = lines.slice(0, 40).join(" ");
  // dd-mm-aaaa, dd/mm/aaaa
  const m = head.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const iso = head.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  return null;
}

// Junta os fragmentos de texto do pdf.js em linhas, agrupando pela coordenada
// vertical: o PDF não tem conceito de "linha", só de pedaços posicionados.
interface TextItemLike { str: string; transform: number[] }

function itemsToLines(items: TextItemLike[]): string[] {
  const rows = new Map<number, { x: number; str: string }[]>();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    // Tolerância de 2pt para fragmentos da mesma linha com baseline ligeiramente diferente.
    let key = y;
    for (const k of rows.keys()) if (Math.abs(k - y) <= 2) { key = k; break; }
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key)!.push({ x: it.transform[4], str: it.str });
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0]) // topo → fundo
    .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function extractFromPdf(file: File): Promise<ExtractedDoc> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

  const lines: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    lines.push(...itemsToLines(content.items as unknown as TextItemLike[]));
  }
  await doc.destroy();

  return { lines, pages: doc.numPages, lab: detectLab(lines), collectedISO: detectDate(lines) };
}
