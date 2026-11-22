import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Lock, RotateCcw, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { Editor, ListaRegistos } from "@/components/ficha/FichaUtente";
import { useIdioma, useT } from "@/lib/i18n";
import { e_clinico, useAlinharEspaco, useSessao } from "@/lib/sessao";
import {
  dataHora,
  membrosDoEspaco,
  rotuloMembro,
  type ConsultaDb,
  type DiarioDb,
  type MembroDb,
  type UtenteDb,
} from "@/lib/dados";

export const Route = createFileRoute("/consulta/$eventoId")({
  head: () => ({ meta: [{ title: "Consulta — Vivara Health" }] }),
  component: ConsultaPage,
});

function ConsultaPage() {
  const { eventoId } = Route.useParams();
  const t = useT();
  const tc = t.consultaDb;
  const tf = t.ficha;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [consulta, setConsulta] = useState<ConsultaDb | null | undefined>(undefined);
  const [utente, setUtente] = useState<UtenteDb | null>(null);
  useAlinharEspaco(consulta?.espaco_id);
  const [membros, setMembros] = useState<MembroDb[]>([]);
  const [seguidores, setSeguidores] = useState<string[]>([]);
  const [registos, setRegistos] = useState<DiarioDb[]>([]);
  const [partilhas, setPartilhas] = useState<Record<string, string[]>>({});

  const carregar = useCallback(async () => {
    const { data: c } = await supabase
      .from("consultas")
      .select("*")
      .eq("id", eventoId)
      .maybeSingle();
    setConsulta(c ?? null);
    if (!c) return;
    const [u, ms, ss, ds] = await Promise.all([
      supabase.from("utentes").select("*").eq("id", c.utente_id).maybeSingle(),
      membrosDoEspaco(c.espaco_id),
      supabase.from("seguimentos").select("membro_id").eq("utente_id", c.utente_id),
      supabase
        .from("diarios")
        .select("*")
        .eq("consulta_id", c.id)
        .order("criado_em", { ascending: false }),
    ]);
    setUtente(u.data ?? null);
    setMembros(ms);
    setSeguidores((ss.data ?? []).map((s) => s.membro_id));
    setRegistos(ds.data ?? []);
    const ids = (ds.data ?? []).map((d) => d.id);
    const { data: ps } = ids.length
      ? await supabase.from("diario_partilhas").select("*").in("diario_id", ids)
      : { data: [] };
    setPartilhas(
      (ps ?? []).reduce<Record<string, string[]>>((acc, p) => {
        (acc[p.diario_id] ??= []).push(p.membro_id);
        return acc;
      }, {}),
    );
  }, [eventoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const rot = { medico: tf.medico, administrativo: tf.administrativo };
  const porId = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros]);
  const nomeDe = (id: string) => (porId.get(id) ? rotuloMembro(porId.get(id)!, rot) : "—");

  if (consulta === undefined) {
    return (
      <PortalShell>
        <div className="px-6 py-16 text-center text-xs text-muted-foreground">
          {t.conta.aProcessar}
        </div>
      </PortalShell>
    );
  }
  if (!consulta || !utente || !atual) {
    return (
      <PortalShell>
        <main className="px-6 py-16 text-center">
          <p className="text-sm text-foreground">{tc.naoEncontrada}</p>
          <Link to="/agenda" className="mt-3 inline-block text-sm text-muted-foreground underline">
            {tc.voltar}
          </Link>
        </main>
        <MobileNavTabs />
      </PortalShell>
    );
  }

  const sigo = e_clinico(atual) && seguidores.includes(atual.id);
  const elegiveis = membros.filter(
    (m) =>
      m.id !== atual.id &&
      m.estado === "ativo" &&
      (!!m.papel_admin ||
        ((m.funcao === "medico" || m.funcao === "profissional") && seguidores.includes(m.id))),
  );

  async function mudarEstado(estado: "realizada" | "falta" | "agendada") {
    await supabase.from("consultas").update({ estado }).eq("id", consulta!.id);
    void carregar();
  }

  const botao =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent";

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-10">
        <Link
          to="/agenda"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tc.voltar}
        </Link>
        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">{tc.titulo(utente.nome)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {dataHora(consulta.inicio, idioma)} · {tf.duracao(consulta.duracao_min)} ·{" "}
              {consulta.tipo === "video" ? tf.video : tf.presencial} ·{" "}
              {nomeDe(consulta.profissional_id)}
            </p>
            {consulta.motivo && <p className="mt-1 text-sm text-foreground">{consulta.motivo}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-accent px-2 py-0.5 text-foreground">
                {tf.estado[consulta.estado]}
              </span>
              <Link
                to="/utentes/$utenteId"
                params={{ utenteId: utente.id }}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {tc.abrirFicha}
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {consulta.estado === "agendada" ? (
              <>
                <button type="button" onClick={() => mudarEstado("falta")} className={botao}>
                  <UserX className="h-3.5 w-3.5" />
                  {tc.marcarFalta}
                </button>
                <button
                  type="button"
                  onClick={() => mudarEstado("realizada")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" />
                  {tc.marcarRealizada}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => mudarEstado("agendada")} className={botao}>
                <RotateCcw className="h-3.5 w-3.5" />
                {tc.reabrir}
              </button>
            )}
          </div>
        </header>

        <div className="mt-6 space-y-4">
          {sigo ? (
            <Editor
              tipo="diario"
              soap
              utente={utente}
              elegiveis={elegiveis}
              consultas={[consulta]}
              rot={rot}
              consultaFixaId={consulta.id}
              onGuardado={carregar}
            />
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-border bg-surface-raised px-4 py-3 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {tc.soClinicos}
            </p>
          )}
          {registos.length > 0 && (
            <section>
              <h2 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {tc.jaRegistado}
              </h2>
              <ListaRegistos
                itens={registos}
                partilhas={partilhas}
                nomeDe={nomeDe}
                vazio=""
                idioma={idioma}
                mostrarAutor
                podeApagar={(r) => r.autor_id === atual.id}
                tabela="diarios"
                onApagado={carregar}
              />
            </section>
          )}
        </div>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}
