import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { useIdioma, useT } from "@/lib/i18n";
import { iniciais, useSessao } from "@/lib/sessao";
import { dataHora, membrosDoEspaco, rotuloMembro, type MembroDb } from "@/lib/dados";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Vivara Health" }] }),
  component: MensagensPage,
});

type Mensagem = Tables<"canal_mensagens">;

// Chat interno da clínica: canal geral e mensagens diretas, só texto.
function MensagensPage() {
  const t = useT();
  const tm = t.mensagens;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [membros, setMembros] = useState<MembroDb[]>([]);
  const [conversa, setConversa] = useState<string | null>(null); // null = geral; senão id do membro
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [draft, setDraft] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const carregar = useCallback(async () => {
    if (!atual) return;
    const { data } = await supabase
      .from("canal_mensagens")
      .select("*")
      .eq("espaco_id", atual.espaco_id)
      .order("criado_em", { ascending: false })
      .limit(300);
    setMensagens((data ?? []).reverse());
  }, [atual]);

  useEffect(() => {
    if (!atual) return;
    void membrosDoEspaco(atual.espaco_id).then(setMembros);
    void carregar();
    const canal = supabase
      .channel(`canal-${atual.espaco_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "canal_mensagens", filter: `espaco_id=eq.${atual.espaco_id}` }, () => void carregar())
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [atual, carregar]);

  const visiveis = useMemo(
    () =>
      mensagens.filter((m) =>
        conversa === null ? m.para_id === null : (m.autor_id === conversa && m.para_id === atual?.id) || (m.autor_id === atual?.id && m.para_id === conversa),
      ),
    [mensagens, conversa, atual],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [visiveis.length, conversa]);

  if (!atual) return null;
  const outros = membros.filter((m) => m.id !== atual.id && m.estado === "ativo");
  const rot = { medico: t.ficha.medico, administrativo: t.ficha.administrativo };
  const nomeDe = (id: string) => membros.find((m) => m.id === id)?.nome_exibicao ?? "—";

  async function enviar() {
    if (!atual || !draft.trim()) return;
    setErro(null);
    const { error } = await supabase.from("canal_mensagens").insert({
      espaco_id: atual.espaco_id,
      autor_id: atual.id,
      para_id: conversa,
      texto: draft.trim().slice(0, 4000),
    });
    if (error) return setErro(t.conta.erroGenerico);
    setDraft("");
    void carregar();
  }

  const itemConversa = (ativo: boolean) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${ativo ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`;

  return (
    <PortalShell>
      <main className="mx-auto flex h-[calc(100vh-57px)] max-w-[1100px] flex-col px-4 py-4 pb-20 sm:px-6 lg:h-[calc(100vh-57px)] lg:pb-4">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{tm.titulo}</h1>
          <p className="hidden max-w-md text-right text-[11px] text-muted-foreground sm:block">{tm.nota}</p>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface-raised md:grid-cols-[240px_1fr]">
          <nav className="max-h-40 overflow-y-auto border-b border-border p-2 md:max-h-none md:border-b-0 md:border-r">
            <button type="button" onClick={() => setConversa(null)} className={itemConversa(conversa === null)}>
              <Hash className="h-4 w-4" />
              <span>
                {tm.geral}
                <span className="block text-[11px] text-muted-foreground">{tm.geralSub}</span>
              </span>
            </button>
            <div className="mt-2 px-3 text-[10.5px] uppercase tracking-wider text-muted-foreground">{tm.diretas}</div>
            {outros.map((m) => (
              <button key={m.id} type="button" onClick={() => setConversa(m.id)} className={itemConversa(conversa === m.id)}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-medium">{iniciais(m.nome_exibicao)}</span>
                <span className="truncate">{rotuloMembro(m, rot)}</span>
              </button>
            ))}
          </nav>
          <section className="flex min-h-0 flex-col">
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {visiveis.length === 0 && <p className="mt-8 text-center text-xs text-muted-foreground">{tm.vazio}</p>}
              {visiveis.map((m) => {
                const mine = m.autor_id === atual.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${mine ? "bg-foreground text-background" : "border border-border bg-surface text-foreground"}`}>
                      {!mine && conversa === null && <div className="mb-0.5 text-[11px] font-medium">{nomeDe(m.autor_id)}</div>}
                      <div className="whitespace-pre-wrap">{m.texto}</div>
                      <div className={`tabular mt-1 text-[9px] ${mine ? "text-background/60" : "text-muted-foreground"}`}>{dataHora(m.criado_em, idioma)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {erro && (
              <p role="alert" className="px-4 text-xs text-state-alert">
                {erro}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar();
              }}
              className="shrink-0 border-t border-border px-3 py-2.5"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={tm.escrever} aria-label={tm.escrever} maxLength={4000} className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
                <button type="submit" aria-label={tm.enviar} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}
