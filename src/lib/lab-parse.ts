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
const MARKER_ALIASES: { marker: string; aliases: string[] }[] = [
  { marker: "Estradiol",         aliases: ["estradiol", "estradiol (e2)", "17-beta-estradiol", "17 beta estradiol", "e2"] },
  { marker: "FSH",               aliases: ["fsh", "hormona folículo estimulante", "hormona foliculo estimulante"] },
  { marker: "LH",                aliases: ["lh", "hormona luteinizante"] },
  { marker: "Progesterona",      aliases: ["progesterona"] },
  { marker: "Testosterona total", aliases: ["testosterona total", "testosterona"] },
  { marker: "SHBG",              aliases: ["shbg", "globulina de ligacao"] },
  { marker: "DHEA-S",            aliases: ["dhea-s", "dhea s", "sulfato de dheas", "dheas"] },
  { marker: "Cortisol matinal",  aliases: ["cortisol matinal", "cortisol"] },
  { marker: "Prolactina",        aliases: ["prolactina"] },
  { marker: "AMH",               aliases: ["amh", "hormona anti-mulleriana", "hormona anti mulleriana"] },
  { marker: "ApoB",              aliases: ["apolipoproteina b", "apolipoproteína b", "apo b", "apob"] },
  { marker: "Apo A1",            aliases: ["apolipoproteina a1", "apolipoproteína a1", "apo a1", "apoa1"] },
  { marker: "LDL-C",             aliases: ["colesterol ldl", "ldl colesterol", "c-ldl", "ldl-c", "ldl"] },
  { marker: "HDL-C",             aliases: ["colesterol hdl", "hdl colesterol", "c-hdl", "hdl-c", "hdl"] },
  { marker: "Colesterol total",  aliases: ["colesterol total", "colesterol, total"] },
  { marker: "Triglicéridos",     aliases: ["triglicerideos", "triglicéridos", "trigliceridos", "triglicerides"] },
  { marker: "Lp(a)",             aliases: ["lipoproteina (a)", "lipoproteína (a)", "lp(a)", "lpa"] },
  { marker: "HbA1c",             aliases: ["hemoglobina a1c", "hemoglobina glicada", "hemoglobina glicosilada", "hba1c", "a1c"] },
  { marker: "Glicose",           aliases: ["glicose jejum", "glicose em jejum", "glicemia jejum", "glicose", "glicemia"] },
  { marker: "Insulina",          aliases: ["insulina"] },
  { marker: "HOMA-IR",           aliases: ["homa-ir", "homa ir", "indice homa", "índice homa"] },
  { marker: "Peptídeo C",        aliases: ["peptideo c", "peptídeo c", "peptido c"] },
  { marker: "TSH",               aliases: ["tsh", "tirotropina"] },
  { marker: "T4 livre",          aliases: ["t4 livre", "tiroxina livre", "ft4"] },
  { marker: "T3 livre",          aliases: ["t3 livre", "triiodotironina livre", "ft3"] },
  { marker: "Anti-TPO",          aliases: ["anti-tpo", "anti tpo", "anticorpos anti-peroxidase"] },
  { marker: "PCR-us",            aliases: ["pcr ultrassensivel", "pcr ultra-sensivel", "proteina c reactiva ultrassensivel", "pcr us", "pcr-as", "proteina c reactiva", "proteína c reativa"] },
  { marker: "Homocisteína",      aliases: ["homocisteina", "homocisteína"] },
  { marker: "Fibrinogénio",      aliases: ["fibrinogenio", "fibrinogénio"] },
  { marker: "Ácido úrico",       aliases: ["acido urico", "ácido úrico"] },
  { marker: "Vitamina D",        aliases: ["25-oh vitamina d", "25 oh vitamina d", "vitamina d 25 oh", "25-hidroxivitamina d", "vitamina d3", "vitamina d"] },
  { marker: "Vitamina B12",      aliases: ["vitamina b12", "cobalamina", "b12"] },
  { marker: "Folato",            aliases: ["folato", "acido folico", "ácido fólico"] },
  { marker: "Ferritina",         aliases: ["ferritina"] },
  { marker: "Ferro sérico",      aliases: ["ferro serico", "ferro sérico", "ferro"] },
  { marker: "Transferrina",      aliases: ["transferrina"] },
  { marker: "Magnésio",          aliases: ["magnesio", "magnésio"] },
  { marker: "Zinco",             aliases: ["zinco"] },
  { marker: "Selénio",           aliases: ["selenio", "selénio"] },
  { marker: "Cálcio",            aliases: ["calcio", "cálcio"] },
  { marker: "PTH",               aliases: ["pth", "paratormona"] },
  { marker: "Fósforo",           aliases: ["fosforo", "fósforo"] },
  { marker: "ALT",               aliases: ["alt", "tgp", "alanina aminotransferase"] },
  { marker: "AST",               aliases: ["ast", "tgo", "aspartato aminotransferase"] },
  { marker: "GGT",               aliases: ["ggt", "gama gt", "gama-gt"] },
  { marker: "Fosfatase alcalina", aliases: ["fosfatase alcalina"] },
  { marker: "Bilirrubina total", aliases: ["bilirrubina total"] },
  { marker: "Albumina",          aliases: ["albumina"] },
  { marker: "Proteína total",    aliases: ["proteinas totais", "proteína total", "proteinas total"] },
  { marker: "Creatinina",        aliases: ["creatinina"] },
  { marker: "TFG estimada",      aliases: ["tfg", "taxa de filtracao glomerular", "egfr"] },
  { marker: "Ureia",             aliases: ["ureia"] },
  { marker: "Cistatina C",       aliases: ["cistatina c"] },
  { marker: "Hemoglobina",       aliases: ["hemoglobina"] },
  { marker: "Hematócrito",       aliases: ["hematocrito", "hematócrito"] },
  { marker: "Eritrócitos",       aliases: ["eritrocitos", "eritrócitos", "globulos vermelhos"] },
  { marker: "VGM",               aliases: ["vgm", "volume globular medio"] },
  { marker: "HGM",               aliases: ["hgm", "hemoglobina globular media"] },
  { marker: "RDW",               aliases: ["rdw"] },
  { marker: "Leucócitos",        aliases: ["leucocitos", "leucócitos", "globulos brancos"] },
  { marker: "Neutrófilos",       aliases: ["neutrofilos", "neutrófilos"] },
  { marker: "Linfócitos",        aliases: ["linfocitos", "linfócitos"] },
  { marker: "Plaquetas",         aliases: ["plaquetas"] },
  { marker: "Eosinófilos",       aliases: ["eosinofilos", "eosinófilos"] },
];

const LABS = ["Synlab", "CUF", "Joaquim Chaves", "Germano de Sousa", "Unilabs", "Labeto", "Beatriz Godinho"];

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

// Unidades aceites. Serve para não confundir o número do valor com números que
// aparecem noutras colunas (datas, códigos de exame, intervalos).
const UNIT_RE = /(mg\/dL|g\/dL|µg\/dL|ug\/dL|ng\/mL|pg\/mL|µU\/mL|uU\/mL|mUI\/mL|mUI\/L|UI\/mL|U\/L|µmol\/L|umol\/L|mmol\/L|nmol\/L|mg\/L|µg\/L|ug\/L|ng\/dL|10\^?[369]\/L|10\^?12\/L|mL\/min[^\s]*|fL|pg|%|mm\/h|mg\/g)/i;

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

export function parseLine(line: string): ParsedValue | null {
  const clean = line.replace(/\.{3,}/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length < 4) return null;
  const n = norm(clean);

  // Escolhe o alias mais longo que apareça no início da linha, para
  // "colesterol total" não ser capturado por "colesterol".
  let best: { marker: string; alias: string } | null = null;
  for (const entry of MARKER_ALIASES) {
    for (const alias of entry.aliases) {
      const idx = n.indexOf(alias);
      // O nome do parâmetro está no início da linha, não perdido no meio.
      if (idx !== 0) continue;
      if (!best || alias.length > best.alias.length) best = { marker: entry.marker, alias };
    }
  }
  if (!best) return null;

  const rest = clean.slice(best.alias.length);
  const tokens = rest.split(/\s+/).filter(Boolean);

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
  const ref = extractRef(unit ? after.slice(after.indexOf(unit) + unit.length) : after);

  return {
    marker: best.marker,
    label: clean.slice(0, best.alias.length).trim(),
    raw: line.trim(),
    value,
    unit,
    ref,
    keep: true,
  };
}

export function parseValues(lines: string[]): ParsedValue[] {
  const out: ParsedValue[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const v = parseLine(line);
    if (!v || !v.marker) continue;
    // Uma folha repete o nome do parâmetro no cabeçalho e no rodapé; fica o
    // primeiro reconhecido, que é o da tabela de resultados.
    if (seen.has(v.marker)) continue;
    seen.add(v.marker);
    out.push(v);
  }
  return out;
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
