import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Dna,
  FlaskConical,
  HeartPulse,
  Lock,
  Pencil,
  Pill,
  Plus,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";
import type { NotaConsultaMedico, Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";

const tipoNotaLabel: Record<NotaConsultaMedico["tipo"], string> = {
  primeira: "Primeira consulta",
  seguimento: "Seguimento",
  intercorrencia: "Intercorrência",
};

const gravidadeTone: Record<string, string> = {
  leve: "border-state-warn/30 bg-state-warn-soft text-state-warn",
  moderada: "border-state-alert/30 bg-state-alert-soft text-state-alert",
  grave: "border-state-alert/40 bg-state-alert-soft text-state-alert",
};

export function AnamnesePanel({ utente }: { utente: Utente }) {
  const f = utente.fichaClinica;
  const notasOrdenadas = [...utente.notasMedicas].sort((a, b) =>
    a.data < b.data ? 1 : -1,
  );
  const [draft, setDraft] = useState("");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_460px]">
      {/* Coluna principal: Ficha clínica */}
      <div className="flex flex-col gap-5">
        {/* Banner de privacidade */}
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-raised p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
            <Lock className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">
              Área clínica privada
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visível apenas à equipa médica. A utente não vê esta secção. Ficha preenchida por{" "}
              <span className="text-foreground">{f.preenchidaPor}</span> em{" "}
              {formatarData(f.preenchidaEm)}.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar ficha
          </button>
        </div>

        {/* Alergias — destaque no topo */}
        <Section
          icon={<AlertTriangle className="h-4 w-4 text-state-alert" />}
          title="Alergias a medicamentos"
          count={f.alergiasMedicamentos.length}
          accent
        >
          {f.alergiasMedicamentos.length === 0 ? (
            <Empty texto="Sem alergias conhecidas" />
          ) : (
            <ul className="flex flex-col gap-2">
              {f.alergiasMedicamentos.map((a) => (
                <li
                  key={a.substancia}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {a.substancia}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.reacao}</div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
                      gravidadeTone[a.gravidade] ?? ""
                    }`}
                  >
                    {a.gravidade}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Section
            icon={<HeartPulse className="h-4 w-4 text-foreground" />}
            title="Antecedentes pessoais"
            count={f.antecedentesPessoais.length}
          >
            <ul className="flex flex-col gap-1.5">
              {f.antecedentesPessoais.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span className="min-w-0">{p}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            icon={<Users className="h-4 w-4 text-foreground" />}
            title="Antecedentes familiares"
            count={f.antecedentesFamiliares.length}
          >
            <ul className="flex flex-col gap-2">
              {f.antecedentesFamiliares.map((af, i) => (
                <li
                  key={`${af.familiar}-${i}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="text-foreground">{af.condicao}</span>
                    <span className="text-muted-foreground"> · {af.familiar}</span>
                  </div>
                  {af.idadeDiagnostico && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {af.idadeDiagnostico} anos
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            icon={<Pill className="h-4 w-4 text-foreground" />}
            title="Medicação habitual"
            count={f.medicacaoHabitual.length}
          >
            <ul className="flex flex-col gap-2">
              {f.medicacaoHabitual.map((m) => (
                <li
                  key={m.nome}
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5"
                >
                  <div className="text-sm font-medium text-foreground">
                    {m.nome}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {m.posologia}
                    {m.desde && <span> · desde {m.desde}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            icon={<Sparkles className="h-4 w-4 text-foreground" />}
            title="Suplementação"
            count={f.suplementacao.length}
          >
            <ul className="flex flex-col gap-2">
              {f.suplementacao.map((s) => (
                <li
                  key={s.nome}
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5"
                >
                  <div className="text-sm font-medium text-foreground">{s.nome}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.posologia}
                    {s.desde && <span> · desde {s.desde}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            icon={<Scissors className="h-4 w-4 text-foreground" />}
            title="Antecedentes cirúrgicos"
            count={f.antecedentesCirurgicos.length}
          >
            <ul className="flex flex-col gap-2">
              {f.antecedentesCirurgicos.map((c, i) => (
                <li
                  key={`${c.intervencao}-${i}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="text-foreground">{c.intervencao}</div>
                    {c.nota && (
                      <div className="text-xs text-muted-foreground">{c.nota}</div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.ano}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {f.habitos && (
            <Section
              icon={<Dna className="h-4 w-4 text-foreground" />}
              title="Hábitos & estilo de vida"
            >
              <dl className="flex flex-col gap-2 text-sm">
                {Object.entries(f.habitos).map(([k, v]) =>
                  v ? (
                    <div key={k} className="flex items-start justify-between gap-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="min-w-0 text-right text-foreground">{v}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </Section>
          )}
        </div>

        {f.notasGerais && (
          <Section
            icon={<ClipboardList className="h-4 w-4 text-foreground" />}
            title="Notas gerais da médica"
          >
            <p className="font-serif text-base leading-relaxed text-foreground">
              {f.notasGerais}
            </p>
          </Section>
        )}
      </div>

      {/* Coluna lateral: Diário de consultas */}
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Diário clínico
              </div>
              <h3 className="font-serif mt-1 text-2xl text-foreground">
                Nova entrada
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3 w-3" />
              Privado
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="O que foi falado, novidades, plano para a próxima consulta…"
            className="mt-3 min-h-[120px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {draft.length} caracteres
            </span>
            <button
              type="button"
              disabled={draft.trim().length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Guardar entrada
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Histórico · {notasOrdenadas.length} entradas
          </div>
        </div>

        <ol className="flex flex-col gap-3">
          {notasOrdenadas.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-border bg-surface-raised p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {formatarData(n.data)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      n.tipo === "primeira"
                        ? "border-primary/30 bg-accent text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {tipoNotaLabel[n.tipo]}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{n.autor}</span>
              </div>

              <div className="mt-3 flex flex-col gap-2.5 text-sm">
                {n.subjetivo && (
                  <Field label="S — Subjetivo" texto={n.subjetivo} />
                )}
                {n.objetivo && <Field label="O — Objetivo" texto={n.objetivo} />}
                {n.avaliacao && (
                  <Field label="A — Avaliação" texto={n.avaliacao} />
                )}
                {n.plano && (
                  <Field
                    label="P — Plano"
                    texto={n.plano}
                    icon={<FlaskConical className="h-3 w-3" />}
                  />
                )}
              </div>

              {n.proximaRevisao && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Próxima revisão: {formatarData(n.proximaRevisao)}
                </div>
              )}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Section({
  icon,
  title,
  count,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border bg-surface-raised p-5 ${
        accent ? "border-state-alert/30" : "border-border"
      }`}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        {typeof count === "number" && (
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {count}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  texto,
  icon,
}: {
  label: string;
  texto: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-xs text-muted-foreground">
      {texto}
    </div>
  );
}