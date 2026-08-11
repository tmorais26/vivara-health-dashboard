import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, X } from "lucide-react";
import type { Mensagem, Utente } from "@/data/mock-utente";
import { formatarDataHora } from "@/data/mock-utente";

/**
 * Conversa partilhada entre médica e utente — a mesma thread (utente.conversas
 * "c-sofia") vista aqui como a médica e na app da utente (rota /app) como a utente.
 * Painel dedicado (não um modal genérico): ecrã inteiro no mobile, coluna
 * lateral fixa no desktop — cabeçalho e input fixos, mensagens com scroll próprio.
 */
export function ChatModal({
  open,
  onClose,
  utente,
}: {
  open: boolean;
  onClose: () => void;
  utente: Utente;
}) {
  const conversa = utente.conversas.find((c) => c.id === "c-sofia");
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Mensagem[]>(conversa?.mensagens ?? []);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, msgs]);

  if (!open) return null;

  function send() {
    if (!draft.trim()) return;
    setMsgs((prev) => [
      ...prev,
      {
        id: `m-${prev.length}`,
        autor: "medica",
        texto: draft.trim(),
        enviadaEm: new Date().toISOString(),
        lida: true,
      },
    ]);
    setDraft("");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface-raised shadow-2xl sm:w-[420px] sm:border-l sm:border-border"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent sm:hidden"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-serif truncate text-[16px] leading-tight text-foreground">
              {utente.nome}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Conversa partilhada · visível na app da utente
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {msgs.map((m) => {
            const mine = m.autor === "medica";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${
                    mine
                      ? "bg-foreground text-background"
                      : "border border-border bg-surface text-foreground"
                  }`}
                >
                  <div>{m.texto}</div>
                  <div
                    className={`tabular mt-1 text-[9px] ${
                      mine ? "text-background/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatarDataHora(m.enviadaEm)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-border bg-surface-raised px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escrever mensagem…"
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              type="button"
              onClick={send}
              aria-label="Enviar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
