import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Ban,
  FileText,
  MessageSquareOff,
  MoreVertical,
  Paperclip,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Utente } from "@/data/mock-utente";
import { formatarDataHora } from "@/data/mock-utente";
import { chatAcoes, useChat, type Anexo } from "@/lib/chat-store";
import { useT } from "@/lib/i18n";

const MAX_ANEXO = 10 * 1024 * 1024;

function tamanho(b: number) {
  return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatModal({
  open,
  onClose,
  utente,
}: {
  open: boolean;
  onClose: () => void;
  utente: Pick<Utente, "id" | "nome">;
}) {
  const t = useT().chat;
  const chat = useChat(utente.id);
  const [draft, setDraft] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else if (confirmarEliminar) setConfirmarEliminar(false);
      else onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose, menuOpen, confirmarEliminar]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, chat.mensagens.length]);

  if (!open) return null;

  function send() {
    if (!draft.trim() && anexos.length === 0) return;
    chatAcoes.enviar(utente.id, draft.trim(), anexos);
    setDraft("");
    setAnexos([]);
  }

  function escolherFicheiros(files: FileList | null) {
    setErroAnexo(null);
    if (!files) return;
    const novos: Anexo[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        setErroAnexo(t.anexoTipo);
        continue;
      }
      if (f.size > MAX_ANEXO) {
        setErroAnexo(t.anexoGrande);
        continue;
      }
      novos.push({ nome: f.name, tipo: f.type, tamanho: f.size, url: URL.createObjectURL(f) });
    }
    setAnexos((a) => [...a, ...novos]);
    if (fileRef.current) fileRef.current.value = "";
  }

  const estadoLabel =
    chat.estado === "ativo" ? t.estadoAtivo : chat.estado === "bloqueado" ? t.estadoBloqueado : t.estadoDesativado;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t.fechar}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${t.subtitulo} · ${utente.nome}`}
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface-raised shadow-2xl sm:w-[420px] sm:border-l sm:border-border"
      >
        <header className="relative flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.voltar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent sm:hidden"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-serif truncate text-[16px] leading-tight text-foreground">{utente.nome}</div>
            <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  chat.estado === "ativo" ? "bg-state-ok" : chat.estado === "bloqueado" ? "bg-state-alert" : "bg-muted-foreground"
                }`}
              />
              {estadoLabel}
            </div>
          </div>
          {chat.estado !== "desativado" && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.opcoes}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.fechar}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
          >
            <X className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-3 top-full z-10 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg"
            >
              <MenuItem
                icon={<Ban className="h-4 w-4" />}
                label={chat.estado === "bloqueado" ? t.desbloquear : t.bloquear}
                ajuda={chat.estado === "bloqueado" ? undefined : t.bloquearAjuda}
                onClick={() => {
                  chatAcoes.definirEstado(utente.id, chat.estado === "bloqueado" ? "ativo" : "bloqueado");
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                icon={<MessageSquareOff className="h-4 w-4" />}
                label={t.desativar}
                ajuda={t.desativarAjuda}
                onClick={() => {
                  chatAcoes.definirEstado(utente.id, "desativado");
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                icon={<Trash2 className="h-4 w-4" />}
                label={t.eliminar}
                ajuda={t.eliminarAjuda}
                perigo
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmarEliminar(true);
                }}
              />
            </div>
          )}
        </header>

        {chat.estado === "desativado" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-foreground">{t.estadoDesativado}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.desativadoTexto}</p>
            <button
              type="button"
              onClick={() => chatAcoes.definirEstado(utente.id, "ativo")}
              className="mt-5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
            >
              {t.ativar}
            </button>
          </div>
        ) : (
          <>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {chat.mensagens.length === 0 && (
                <p className="mx-auto mt-8 max-w-[260px] text-center text-xs text-muted-foreground">{t.vazio}</p>
              )}
              {chat.mensagens.map((m) => {
                const mine = m.autor === "medico";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${
                        mine ? "bg-foreground text-background" : "border border-border bg-surface text-foreground"
                      }`}
                    >
                      {m.anexos?.map((a, i) => (
                        <AnexoView key={i} anexo={a} mine={mine} />
                      ))}
                      {m.texto && <div className="whitespace-pre-wrap">{m.texto}</div>}
                      <div className={`tabular mt-1 text-[9px] ${mine ? "text-background/60" : "text-muted-foreground"}`}>
                        {formatarDataHora(m.enviadaEm)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {chat.estado === "bloqueado" ? (
              <div className="shrink-0 border-t border-border px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">{t.bloqueadoTexto}</p>
                <button
                  type="button"
                  onClick={() => chatAcoes.definirEstado(utente.id, "ativo")}
                  className="mt-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {t.desbloquear}
                </button>
              </div>
            ) : (
              <div className="shrink-0 border-t border-border bg-surface-raised px-3 py-2.5">
                {anexos.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-1.5">
                    {anexos.map((a, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{a.nome}</span>
                        <button
                          type="button"
                          aria-label={`${t.removerAnexo}: ${a.nome}`}
                          onClick={() => setAnexos((xs) => xs.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {erroAnexo && (
                  <p role="alert" className="mb-2 text-[11px] text-state-alert">
                    {erroAnexo}
                  </p>
                )}
                <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => escolherFicheiros(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={t.anexar}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t.escrever}
                    aria-label={t.escrever}
                    className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                  />
                  <button
                    type="button"
                    onClick={send}
                    aria-label={t.enviar}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {confirmarEliminar && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-6">
            <div role="alertdialog" aria-modal="true" className="w-full rounded-2xl border border-border bg-surface-raised p-5">
              <p className="text-sm font-medium text-foreground">{t.eliminar}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.eliminarAjuda}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setConfirmarEliminar(false)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {t.cancelar}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    chatAcoes.eliminarConversa(utente.id);
                    setConfirmarEliminar(false);
                  }}
                  className="rounded-full bg-state-alert px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  {t.eliminarConfirmar}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  ajuda,
  onClick,
  perigo,
}: {
  icon: React.ReactNode;
  label: string;
  ajuda?: string;
  onClick: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-accent ${
        perigo ? "text-state-alert" : "text-foreground"
      }`}
    >
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-sm">{label}</span>
        {ajuda && <span className="block text-[11px] text-muted-foreground">{ajuda}</span>}
      </span>
    </button>
  );
}

function AnexoView({ anexo, mine }: { anexo: Anexo; mine: boolean }) {
  if (anexo.url && anexo.tipo.startsWith("image/")) {
    return (
      <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
        <img src={anexo.url} alt={anexo.nome} className="max-h-48 rounded-lg object-cover" />
      </a>
    );
  }
  const conteudo = (
    <>
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate">{anexo.nome}</span>
        <span className={`block text-[9.5px] ${mine ? "text-background/60" : "text-muted-foreground"}`}>
          {tamanho(anexo.tamanho)}
        </span>
      </span>
    </>
  );
  const cls = `mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 ${mine ? "bg-background/10" : "bg-accent"}`;
  return anexo.url ? (
    <a href={anexo.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {conteudo}
    </a>
  ) : (
    <div className={cls}>{conteudo}</div>
  );
}
