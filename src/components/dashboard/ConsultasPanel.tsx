import { CalendarClock, FileText, Stethoscope, Video } from "lucide-react";
import { formatarData, type Utente } from "@/data/mock-utente";

export function ConsultasPanel({ utente }: { utente: Utente }) {
  const consultas = [...utente.consultas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  const notasPorConsulta = new Map(
    utente.notasMedicas.filter((n) => n.consultaId).map((n) => [n.consultaId, n]),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Histórico de consultas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Linha temporal cronológica reversa. Cada consulta com nota e plano associados.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Agendar consulta
          </button>
        </div>

        <ol className="relative space-y-4 border-l-2 border-border pl-6">
          {consultas.map((c) => {
            const nota = notasPorConsulta.get(c.id);
            const isAgendada = c.estado === "agendada";
            return (
              <li key={c.id} className="relative">
                <span
                  className={`absolute -left-[33px] mt-2 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isAgendada
                      ? "border-state-warn bg-surface-raised"
                      : "border-border bg-surface-raised"
                  }`}
                >
                  {c.tipo === "video" ? (
                    <Video className="h-2.5 w-2.5 text-foreground" />
                  ) : (
                    <Stethoscope className="h-2.5 w-2.5 text-foreground" />
                  )}
                </span>

                <article className="rounded-2xl border border-border bg-surface-raised p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg text-foreground">
                          {formatarData(c.data)} · {c.hora}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            isAgendada
                              ? "bg-state-warn-soft text-state-warn"
                              : c.estado === "realizada"
                                ? "bg-state-ok-soft text-state-ok"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {c.estado}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {c.duracao} · {c.tipo === "video" ? "Vídeo" : "Presencial"}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-foreground">{c.motivo}</p>

                  {c.resumo && (
                    <div className="mt-3 rounded-xl bg-accent/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Resumo
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
                        {c.resumo}
                      </p>
                    </div>
                  )}

                  {nota && (
                    <details className="group mt-3 rounded-xl border border-state-warn/30 bg-state-warn-soft/20 p-3">
                      <summary className="flex cursor-pointer items-center gap-2 text-[10.5px] uppercase tracking-wider text-state-warn">
                        <FileText className="h-3 w-3" />
                        Nota interna SOAP · {nota.tipo === "primeira" ? "1ª consulta" : nota.tipo}
                      </summary>
                      <div className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-foreground/85">
                        {nota.subjetivo && (
                          <div>
                            <span className="font-medium text-foreground">S · </span>
                            {nota.subjetivo}
                          </div>
                        )}
                        {nota.objetivo && (
                          <div>
                            <span className="font-medium text-foreground">O · </span>
                            {nota.objetivo}
                          </div>
                        )}
                        {nota.avaliacao && (
                          <div>
                            <span className="font-medium text-foreground">A · </span>
                            {nota.avaliacao}
                          </div>
                        )}
                        {nota.plano && (
                          <div>
                            <span className="font-medium text-foreground">P · </span>
                            {nota.plano}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {c.preparacao && c.preparacao.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Preparação para esta consulta
                      </div>
                      <ul className="mt-2 space-y-1 text-[13px] text-foreground/85">
                        {c.preparacao.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-muted-foreground">·</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      <aside className="space-y-3">
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Resumo do percurso
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de consultas</span>
              <span className="tabular font-medium text-foreground">{consultas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Realizadas</span>
              <span className="tabular font-medium text-foreground">
                {consultas.filter((c) => c.estado === "realizada").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agendadas</span>
              <span className="tabular font-medium text-foreground">
                {consultas.filter((c) => c.estado === "agendada").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notas SOAP</span>
              <span className="tabular font-medium text-foreground">
                {utente.notasMedicas.length}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}