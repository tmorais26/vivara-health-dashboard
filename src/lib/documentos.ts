import type { Tables } from "@/integrations/supabase/types";

export type TipoDocumento = "presenca" | "acompanhante" | "atestado" | "relatorio" | "outro";
export type DocumentoEmitido = Tables<"documentos_emitidos">;
export type ModeloDocumento = Tables<"modelos_documento">;

// Tipos sem dados de saúde: a administrativa também os pode emitir.
export const TIPOS_ADMINISTRATIVOS: TipoDocumento[] = ["presenca", "acompanhante"];

export type Cabecalho = {
  nome: string;
  funcao: string;
  cedula: string | null;
  local: string;
  espaco: string;
};

// Modelos base. Os documentos são emitidos em português (uso em Portugal).
// Os campos entre {{ }} são preenchidos automaticamente; o que fica entre [ ] tem de ser escrito pelo profissional.
export const MODELOS_BASE: { id: string; tipo: TipoDocumento; titulo: string; corpo: string }[] = [
  {
    id: "base-presenca",
    tipo: "presenca",
    titulo: "Declaração de presença",
    corpo:
      "Declara-se, para os devidos efeitos, que {{utente.nome}}, nascido(a) em {{utente.data_nascimento}}, esteve presente em consulta de {{profissional.area}} no dia {{consulta.data}}, entre as {{consulta.hora_inicio}} e as {{consulta.hora_fim}}.",
  },
  {
    id: "base-acompanhante",
    tipo: "acompanhante",
    titulo: "Declaração de acompanhante",
    corpo:
      "Declara-se, para os devidos efeitos, que [nome do acompanhante] acompanhou {{utente.nome}} à consulta de {{profissional.area}} no dia {{consulta.data}}, entre as {{consulta.hora_inicio}} e as {{consulta.hora_fim}}.",
  },
  {
    id: "base-atestado",
    tipo: "atestado",
    titulo: "Atestado médico",
    corpo:
      "Atesto, sob compromisso de honra, que {{utente.nome}}, nascido(a) em {{utente.data_nascimento}}, [descrever a situação clínica ou a aptidão].\n\nPor ser verdade e me ter sido pedido, passo o presente atestado, que assino.",
  },
  {
    id: "base-relatorio",
    tipo: "relatorio",
    titulo: "Relatório médico",
    corpo:
      "Utente: {{utente.nome}}\nData de nascimento: {{utente.data_nascimento}}\n\nMotivo do relatório:\n[...]\n\nHistória clínica:\n[...]\n\nExame objetivo:\n[...]\n\nConclusão:\n[...]",
  },
  {
    id: "base-outro",
    tipo: "outro",
    titulo: "Declaração",
    corpo:
      "Declara-se, para os devidos efeitos, que {{utente.nome}}, nascido(a) em {{utente.data_nascimento}}, [...].",
  },
];

const dataPt = (d: Date) =>
  d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
const horaPt = (d: Date) => d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

export function valoresCampos(opts: {
  utente: { nome: string; data_nascimento: string | null };
  consulta: { inicio: string; fim: string } | null;
  cabecalho: Cabecalho;
}): Record<string, string> {
  const { utente, consulta, cabecalho } = opts;
  return {
    "utente.nome": utente.nome,
    "utente.data_nascimento": utente.data_nascimento
      ? dataPt(new Date(utente.data_nascimento))
      : "[data de nascimento]",
    "consulta.data": consulta ? dataPt(new Date(consulta.inicio)) : "[data]",
    "consulta.hora_inicio": consulta ? horaPt(new Date(consulta.inicio)) : "[hora]",
    "consulta.hora_fim": consulta ? horaPt(new Date(consulta.fim)) : "[hora]",
    "profissional.nome": cabecalho.nome,
    "profissional.area": cabecalho.funcao || "[especialidade]",
    "profissional.cedula": cabecalho.cedula || "[cédula]",
    local: cabecalho.local || "[local]",
    data: dataPt(new Date()),
  };
}

export function preencher(corpo: string, valores: Record<string, string>) {
  return corpo.replace(/\{\{\s*([a-z_.]+)\s*\}\}/g, (m, k: string) => valores[k] ?? m);
}

// Ao guardar um texto já preenchido como modelo, volta a pôr os campos no lugar dos valores deste utente.
export function reverter(texto: string, valores: Record<string, string>) {
  const pares = Object.entries(valores)
    .filter(([, v]) => v.length >= 3 && !v.startsWith("["))
    .sort((a, b) => b[1].length - a[1].length);
  let r = texto;
  for (const [k, v] of pares) r = r.split(v).join(`{{${k}}}`);
  return r;
}

export const temPorPreencher = (texto: string) => /\[[^\]\n]{0,80}\]/.test(texto);

export async function descarregarDocumentoPdf(doc: {
  id: string;
  titulo: string;
  corpo: string;
  emitido_em: string;
  cabecalho: Cabecalho;
}) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 22;
  const largura = 210 - margem * 2;
  const c = doc.cabecalho;
  let y = 24;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(c.nome, margem, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(70);
  for (const linha of [
    c.funcao,
    c.cedula ? `Cédula profissional n.º ${c.cedula}` : "",
    c.local,
  ].filter(Boolean)) {
    y += 5;
    pdf.text(linha, margem, y);
  }
  pdf.setTextColor(0);
  y += 6;
  pdf.setDrawColor(200);
  pdf.line(margem, y, 210 - margem, y);

  y += 16;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(doc.titulo, 105, y, { align: "center" });

  y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const linhas: string[] = pdf.splitTextToSize(doc.corpo, largura);
  for (const linha of linhas) {
    if (y > 250) {
      pdf.addPage();
      y = 24;
    }
    pdf.text(linha, margem, y);
    y += 6;
  }

  if (y > 230) {
    pdf.addPage();
    y = 24;
  }
  y += 14;
  const data = new Date(doc.emitido_em).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  pdf.text(`${c.local ? `${c.local}, ` : ""}${data}`, margem, y);
  y += 24;
  pdf.line(210 - margem - 70, y, 210 - margem, y);
  y += 5;
  pdf.setFontSize(9.5);
  pdf.text(c.nome, 210 - margem - 35, y, { align: "center" });

  pdf.setFontSize(7.5);
  pdf.setTextColor(130);
  pdf.text(`Documento emitido na Vivara · ref. ${doc.id.slice(0, 8).toUpperCase()}`, 105, 287, {
    align: "center",
  });

  const nomeFicheiro = doc.titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  pdf.save(`${nomeFicheiro}-${doc.id.slice(0, 8)}.pdf`);
}
