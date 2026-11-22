import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Field, inputClass } from "@/components/portal/SimpleModal";
import { soData, type UtenteDb } from "@/lib/dados";
import { useIdioma, useT } from "@/lib/i18n";
import { useSessao } from "@/lib/sessao";

export type PedidoExameDb = Tables<"pedidos_exame">;

const botaoPequeno =
  "rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-accent";

// Exames pedidos ao utente que ainda não têm resultado. Aparecem nas pendências da ficha.
export function PedidosExame({
  utente,
  pedidos,
  onMudou,
}: {
  utente: UtenteDb;
  pedidos: PedidoExameDb[];
  onMudou: () => void;
}) {
  const tp = useT().pedidosExame;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [aAdicionar, setAAdicionar] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const pendentes = pedidos.filter((p) => p.estado === "pendente");
  const hoje = new Date().toISOString().slice(0, 10);

  async function adicionar() {
    if (!atual || !descricao.trim()) return;
    if (prazo && prazo < hoje) return setErro(tp.prazoInvalido);
    const { error } = await supabase.from("pedidos_exame").insert({
      espaco_id: utente.espaco_id,
      utente_id: utente.id,
      autor_id: atual.id,
      descricao: descricao.trim(),
      prazo: prazo || null,
    });
    if (error) return setErro(tp.erro);
    setDescricao("");
    setPrazo("");
    setErro(null);
    setAAdicionar(false);
    onMudou();
  }

  async function mudarEstado(p: PedidoExameDb, estado: "recebido" | "cancelado") {
    await supabase.from("pedidos_exame").update({ estado }).eq("id", p.id);
    onMudou();
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5" />
          {tp.titulo}
        </h2>
        {!aAdicionar && (
          <button type="button" className={botaoPequeno} onClick={() => setAAdicionar(true)}>
            {tp.adicionar}
          </button>
        )}
      </div>
      {pendentes.length === 0 && !aAdicionar && (
        <p className="text-sm text-muted-foreground">{tp.vazio}</p>
      )}
      {pendentes.length > 0 && (
        <ul className="divide-y divide-border">
          {pendentes.map((p) => {
            const atrasado = p.prazo ? p.prazo < hoje : false;
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <div className="text-sm text-foreground">{p.descricao}</div>
                  <div
                    className={`text-[11px] ${atrasado ? "text-state-alert" : "text-muted-foreground"}`}
                  >
                    {tp.pedidoEm(soData(p.pedido_em, idioma))}
                    {p.prazo ? ` · ${tp.prazo(soData(p.prazo, idioma))}` : ""}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className={botaoPequeno}
                    onClick={() => void mudarEstado(p, "recebido")}
                  >
                    {tp.recebido}
                  </button>
                  <button
                    type="button"
                    className={botaoPequeno}
                    onClick={() => void mudarEstado(p, "cancelado")}
                  >
                    {tp.cancelar}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {aAdicionar && (
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <Field label={tp.descricao}>
            <input
              className={inputClass}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={tp.descricaoPlaceholder}
              maxLength={300}
              autoFocus
            />
          </Field>
          <Field label={tp.prazoCampo}>
            <input
              className={inputClass}
              type="date"
              value={prazo}
              min={hoje}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </Field>
          <div className="flex gap-1.5 pb-0.5">
            <button type="button" className={botaoPequeno} onClick={() => setAAdicionar(false)}>
              {tp.fechar}
            </button>
            <button
              type="button"
              className={botaoPequeno}
              disabled={!descricao.trim()}
              onClick={() => void adicionar()}
            >
              {tp.guardar}
            </button>
          </div>
        </div>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-xs text-state-alert">
          {erro}
        </p>
      )}
    </section>
  );
}
