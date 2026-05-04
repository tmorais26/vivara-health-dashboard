import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Smartphone,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";

type DocTipo = "analise" | "imagem" | "relatorio" | "consentimento" | "outro";
type DocEstado = "a-processar" | "ocr" | "pronto" | "erro";

type Doc = {
  id: string;
  nome: string;
  tipo: DocTipo;
  origem: "medica" | "utente";
  tamanhoKb: number;
  data: string; // ISO
  estado: DocEstado;
  marcadoresExtraidos?: number;
};

const tipoLabel: Record<DocTipo, string> = {
  analise: "Análise",
  imagem: "Imagem",
  relatorio: "Relatório",
  consentimento: "Consentimento",
  outro: "Outro",
};

const tipoTone: Record<DocTipo, string> = {
  analise: "bg-state-ok-soft text-state-ok",
  imagem: "bg-accent text-foreground",
  relatorio: "bg-state-warn-soft text-state-warn",
  consentimento: "bg-muted text-muted-foreground",
  outro: "bg-muted text-muted-foreground",
};

const seedDocs: Doc[] = [
  {
    id: "d-1",
    nome: "Synlab_painel_lipidico_2026-04.pdf",
    tipo: "analise",
    origem: "utente",
    tamanhoKb: 184,
    data: "2026-04-28",
    estado: "pronto",
    marcadoresExtraidos: 11,
  },
  {
    id: "d-2",
    nome: "Ecografia_tiroideia_relatorio.pdf",
    tipo: "relatorio",
    origem: "medica",
    tamanhoKb: 312,
    data: "2026-03-12",
    estado: "pronto",
  },
  {
    id: "d-3",
    nome: "Consentimento_genomica.pdf",
    tipo: "consentimento",
    origem: "medica",
    tamanhoKb: 96,
    data: "2025-11-04",
    estado: "pronto",
  },
  {
    id: "d-4",
    nome: "DEXA_2026-02.jpg",
    tipo: "imagem",
    origem: "utente",
    tamanhoKb: 2140,
    data: "2026-02-18",
    estado: "pronto",
  },
];

export function DocumentosPanel({ utente }: { utente: Utente }) {
  const [docs, setDocs] = useState<Doc[]>(seedDocs);
  const [filtro, setFiltro] = useState<"todos" | DocTipo>("todos");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function adicionar(files: FileList | null, fonte: "ficheiro" | "camara") {
    if (!files || files.length === 0) return;
    const novos: Doc[] = Array.from(files).map((f, i) => ({
      id: `d-${Date.now()}-${i}`,
      nome: f.name,
      tipo: inferirTipo(f.name),
      origem: "medica",
      tamanhoKb: Math.max(1, Math.round(f.size / 1024)),
      data: new Date().toISOString().slice(0, 10),
      estado: "a-processar",
    }));
    setDocs((prev) => [...novos, ...prev]);
    flash(
      fonte === "camara"
        ? `${novos.length} foto(s) capturada(s)`
        : `${novos.length} ficheiro(s) adicionado(s)`,
    );
    // simular OCR / extracção
    novos.forEach((d, i) => {
      setTimeout(
        () => setDocs((p) => p.map((x) => (x.id === d.id ? { ...x, estado: "ocr" } : x))),
        700 + i * 200,
      );
      setTimeout(
        () =>
          setDocs((p) =>
            p.map((x) =>
              x.id === d.id
                ? {
                    ...x,
                    estado: "pronto",
                    marcadoresExtraidos: d.tipo === "analise" ? 8 : undefined,
                  }
                : x,
            ),
          ),
        2000 + i * 200,
      );
    });
  }

  const filtrados = filtro === "todos" ? docs : docs.filter((d) => d.tipo === filtro);

  return (
    <div className="flex flex-col gap-5">
      {/* Zona de upload */}
      <section className="rounded-2xl border border-dashed border-border bg-surface-raised p-6">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Documentos clínicos
            </div>
            <h2 className="font-serif mt-1 text-2xl text-foreground">
              Carregar para {utente.nome.split(" ")[0]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFs de análises, relatórios, imagens, consentimentos. Análises em PDF são
              processadas com extracção de marcadores para revisão.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" />
              Escolher ficheiros
            </button>
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Camera className="h-3.5 w-3.5" />
              Tirar foto
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            adicionar(e.target.files, "ficheiro");
            e.target.value = "";
          }}
        />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            adicionar(e.target.files, "camara");
            e.target.value = "";
          }}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            adicionar(e.dataTransfer.files, "ficheiro");
          }}
          className="mt-5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-6 py-8 text-center"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-foreground">
            Arrasta ficheiros para aqui
          </div>
          <div className="text-[11px] text-muted-foreground">
            PDF, JPG, PNG, HEIC, CSV, XLSX · até 25 MB cada
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[10.5px] text-muted-foreground lg:hidden">
            <Smartphone className="h-3 w-3" />
            No telemóvel abre câmara, galeria ou ficheiros
          </div>
        </div>
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(["todos", "analise", "imagem", "relatorio", "consentimento", "outro"] as const).map(
          (t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltro(t)}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                filtro === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "todos" ? "Todos" : tipoLabel[t]}
              <span className="ml-1.5 opacity-60">
                {t === "todos" ? docs.length : docs.filter((d) => d.tipo === t).length}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Lista */}
      <ul className="flex flex-col gap-2">
        {filtrados.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <DocIcon tipo={d.tipo} nome={d.nome} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {d.nome}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tipoTone[d.tipo]}`}
                >
                  {tipoLabel[d.tipo]}
                </span>
                {d.origem === "utente" && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Enviado pela utente
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="tabular">{formatarData(d.data)}</span>
                <span>·</span>
                <span className="tabular">
                  {d.tamanhoKb < 1024
                    ? `${d.tamanhoKb} KB`
                    : `${(d.tamanhoKb / 1024).toFixed(1)} MB`}
                </span>
                <EstadoBadge estado={d.estado} />
                {d.marcadoresExtraidos != null && d.estado === "pronto" && (
                  <span className="inline-flex items-center gap-1 text-state-ok">
                    · {d.marcadoresExtraidos} marcadores extraídos
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {d.estado === "pronto" && d.marcadoresExtraidos != null && (
                <button
                  type="button"
                  onClick={() => flash("Abrir revisão de marcadores extraídos")}
                  className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent sm:inline-flex"
                >
                  Rever extracção
                </button>
              )}
              <button
                type="button"
                onClick={() => flash("Documento aberto")}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
              >
                Abrir
              </button>
              <button
                type="button"
                aria-label="Remover"
                onClick={() => setDocs((p) => p.filter((x) => x.id !== d.id))}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-xs text-muted-foreground">
            Sem documentos nesta categoria.
          </li>
        )}
      </ul>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-[11.5px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function inferirTipo(nome: string): DocTipo {
  const n = nome.toLowerCase();
  if (/\.(jpe?g|png|heic|webp)$/.test(n)) return "imagem";
  if (/consent/.test(n)) return "consentimento";
  if (/(synlab|analis|lipid|hormon|painel|hemo)/.test(n)) return "analise";
  if (/(relatorio|ecografia|dexa|ressonan)/.test(n)) return "relatorio";
  return "outro";
}

function DocIcon({ tipo, nome }: { tipo: DocTipo; nome: string }) {
  if (tipo === "imagem" || /\.(jpe?g|png|heic|webp)$/i.test(nome))
    return <ImageIcon className="h-4 w-4 text-foreground/70" />;
  if (/\.(csv|xlsx)$/i.test(nome))
    return <FileSpreadsheet className="h-4 w-4 text-foreground/70" />;
  if (tipo === "analise") return <FileText className="h-4 w-4 text-foreground/70" />;
  return <FileImage className="h-4 w-4 text-foreground/70" />;
}

function EstadoBadge({ estado }: { estado: DocEstado }) {
  if (estado === "pronto")
    return (
      <span className="inline-flex items-center gap-1 text-state-ok">
        · <CheckCircle2 className="h-3 w-3" /> pronto
      </span>
    );
  if (estado === "erro")
    return (
      <span className="inline-flex items-center gap-1 text-state-alert">
        · <X className="h-3 w-3" /> erro
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-state-warn">
      · <Loader2 className="h-3 w-3 animate-spin" />
      {estado === "ocr" ? "extracção OCR" : "a processar"}
    </span>
  );
}