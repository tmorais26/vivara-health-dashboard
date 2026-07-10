import { useState } from "react";
import { Send } from "lucide-react";
import type { Mensagem, Utente } from "@/data/mock-utente";
import { formatarDataHora } from "@/data/mock-utente";
import { SimpleModal } from "@/components/portal/SimpleModal";

/**
 * Conversa partilhada entre médica e utente — a mesma thread (utente.conversas
 * "c-sofia") vista aqui como a médica e na app da utente (rota /app) como a utente.
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
    <SimpleModal
      open={open}
      onClose={onClose}
      title={`Conversa com ${utente.nome}`}
      description="Visível na app da utente e no portal da médica — a mesma conversa dos dois lados."
      width="md"
    >
      <div className="flex h-[420px] flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
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
        <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
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
    </SimpleModal>
  );
}
