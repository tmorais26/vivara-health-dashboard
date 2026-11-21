import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, FileText, MessageSquareOff, MoreVertical, Paperclip, Send, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIdioma, useT } from "@/lib/i18n";
import { useSessao } from "@/lib/sessao";
import { dataHora, type ChatMensagemDb, type UtenteDb } from "@/lib/dados";

const BUCKET = "chat-anexos";
const MAX_ANEXO = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

type Anexo = { path: string; nome: string; tipo: string; tamanho: number };

function tamanho(b: number) {
  return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// Chat médico–utente: só existe se o médico o ativar. Funciona como uma conversa simples:
// texto e anexos (imagem/PDF). Sem chamadas nem marcações.
export function ChatUtente({
  open,
  onClose,
  utente,
  onEstadoMudou,
}: {
  open: boolean;
  onClose: () => void;
  utente: UtenteDb;
  onEstadoMudou: () => void;
}) {
  const t = useT().chat;
  const tc = useT().conta;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [mensagens, setMensagens] = useState<ChatMensagemDb[]>([]);
  const [draft, setDraft] = useState("");
  const [ficheiros, setFicheiros] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const estado = utente.chat_estado;

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("chat_mensagens").select("*").eq("utente_id", utente.id).order("criada_em");
    setMensagens(data ?? []);
  }, [utente.id]);

  useEffect(() => {
    if (!open) return;
    void carregar();
    const canal = supabase
      .channel(`chat-${utente.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_mensagens", filter: `utente_id=eq.${utente.id}` }, () => void carregar())
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [open, utente.id, carregar]);

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
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, mensagens.length]);

  if (!open || !atual) return null;

  async function definir(novo: "ativo" | "bloqueado" | "desativado") {
    setMenuOpen(false);
    const { error } = await supabase.rpc("definir_chat", { p_utente: utente.id, p_estado: novo });
    if (error) return setErro(tc.erroGenerico);
    onEstadoMudou();
  }

  async function eliminar() {
    setConfirmarEliminar(false);
    const pasta = `${utente.espaco_id}/${utente.id}`;
    const { data: objs } = await supabase.storage.from(BUCKET).list(pasta, { limit: 1000 });
    if (objs?.length) await supabase.storage.from(BUCKET).remove(objs.map((o) => `${pasta}/${o.name}`));
    const { error } = await supabase.rpc("eliminar_conversa", { p_utente: utente.id });
    if (error) return setErro(tc.erroGenerico);
    void carregar();
  }

  function escolher(files: FileList | null) {
    setErro(null);
    const ok: File[] = [];
    for (const f of Array.from(files ?? [])) {
      if (!TIPOS.includes(f.type)) setErro(t.anexoTipo);
      else if (f.size > MAX_ANEXO) setErro(t.anexoGrande);
      else ok.push(f);
    }
    setFicheiros((xs) => [...xs, ...ok]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function enviar() {
    if (!atual || (!draft.trim() && ficheiros.length === 0)) return;
    setAEnviar(true);
    setErro(null);
    const anexos: Anexo[] = [];
    for (const f of ficheiros) {
      const nomeSeguro = f.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
      const path = `${utente.espaco_id}/${utente.id}/${crypto.randomUUID()}-${nomeSeguro}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
      if (error) {
        setAEnviar(false);
        return setErro(tc.erroGenerico);
      }
      anexos.push({ path, nome: f.name, tipo: f.type, tamanho: f.size });
    }
    const { error } = await supabase.from("chat_mensagens").insert({
      espaco_id: utente.espaco_id,
      utente_id: utente.id,
      autor_membro_id: atual.id,
      texto: draft.trim(),
      anexos,
    });
    setAEnviar(false);
    if (error) return setErro(tc.erroGenerico);
    setDraft("");
    setFicheiros([]);
    void carregar();
  }

  const estadoLabel = estado === "ativo" ? t.estadoAtivo : estado === "bloqueado" ? t.estadoBloqueado : t.estadoDesativado;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t.fechar} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label={`${t.subtitulo} · ${utente.nome}`} className="relative flex h-full w-full flex-col overflow-hidden bg-surface-raised shadow-2xl sm:w-[420px] sm:border-l sm:border-border">
        <header className="relative flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <button type="button" onClick={onClose} aria-label={t.voltar} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent sm:hidden">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-serif truncate text-[16px] leading-tight text-foreground">{utente.nome}</div>
            <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${estado === "ativo" ? "bg-state-ok" : estado === "bloqueado" ? "bg-state-alert" : "bg-muted-foreground"}`} />
              {estadoLabel}
            </div>
          </div>
          {estado !== "desativado" && (
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={t.opcoes} aria-expanded={menuOpen} aria-haspopup="menu" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label={t.fechar} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:flex">
            <X className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-3 top-full z-10 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
              <ItemMenu icon={<Ban className="h-4 w-4" />} label={estado === "bloqueado" ? t.desbloquear : t.bloquear} ajuda={estado === "bloqueado" ? undefined : t.bloquearAjuda} onClick={() => definir(estado === "bloqueado" ? "ativo" : "bloqueado")} />
              <ItemMenu icon={<MessageSquareOff className="h-4 w-4" />} label={t.desativar} ajuda={t.desativarAjuda} onClick={() => definir("desativado")} />
              <ItemMenu
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

        {estado === "desativado" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-foreground">{t.estadoDesativado}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.desativadoTexto}</p>
            <button type="button" onClick={() => definir("ativo")} className="mt-5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90">
              {t.ativar}
            </button>
          </div>
        ) : (
          <>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {mensagens.length === 0 && <p className="mx-auto mt-8 max-w-[260px] text-center text-xs text-muted-foreground">{t.vazio}</p>}
              {mensagens.map((m) => {
                const mine = !m.do_utente;
                const anexos = (Array.isArray(m.anexos) ? m.anexos : []) as unknown as Anexo[];
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${mine ? "bg-foreground text-background" : "border border-border bg-surface text-foreground"}`}>
                      {anexos.map((a) => (
                        <AnexoLink key={a.path} anexo={a} mine={mine} />
                      ))}
                      {m.texto && <div className="whitespace-pre-wrap">{m.texto}</div>}
                      <div className={`tabular mt-1 text-[9px] ${mine ? "text-background/60" : "text-muted-foreground"}`}>{dataHora(m.criada_em, idioma)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {estado === "bloqueado" ? (
              <div className="shrink-0 border-t border-border px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">{t.bloqueadoTexto}</p>
                <button type="button" onClick={() => definir("ativo")} className="mt-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                  {t.desbloquear}
                </button>
              </div>
            ) : (
              <div className="shrink-0 border-t border-border bg-surface-raised px-3 py-2.5">
                {ficheiros.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-1.5">
                    {ficheiros.map((f, i) => (
                      <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{f.name}</span>
                        <button type="button" aria-label={`${t.removerAnexo}: ${f.name}`} onClick={() => setFicheiros((xs) => xs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {erro && (
                  <p role="alert" className="mb-2 text-[11px] text-state-alert">
                    {erro}
                  </p>
                )}
                <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5">
                  <input ref={fileRef} type="file" multiple accept={TIPOS.join(",")} className="hidden" onChange={(e) => escolher(e.target.files)} />
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label={t.anexar} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t.escrever}
                    aria-label={t.escrever}
                    maxLength={4000}
                    className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !aEnviar) void enviar();
                    }}
                  />
                  <button type="button" onClick={() => void enviar()} disabled={aEnviar} aria-label={t.enviar} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-50">
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
                <button type="button" autoFocus onClick={() => setConfirmarEliminar(false)} className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                  {t.cancelar}
                </button>
                <button type="button" onClick={() => void eliminar()} className="rounded-full bg-state-alert px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
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

function ItemMenu({ icon, label, ajuda, onClick, perigo }: { icon: React.ReactNode; label: string; ajuda?: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-accent ${perigo ? "text-state-alert" : "text-foreground"}`}>
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-sm">{label}</span>
        {ajuda && <span className="block text-[11px] text-muted-foreground">{ajuda}</span>}
      </span>
    </button>
  );
}

function AnexoLink({ anexo, mine }: { anexo: Anexo; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    void supabase.storage
      .from(BUCKET)
      .createSignedUrl(anexo.path, 3600)
      .then(({ data }) => vivo && setUrl(data?.signedUrl ?? null));
    return () => {
      vivo = false;
    };
  }, [anexo.path]);
  if (url && anexo.tipo.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
        <img src={url} alt={anexo.nome} className="max-h-48 rounded-lg object-cover" />
      </a>
    );
  }
  return (
    <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" className={`mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 ${mine ? "bg-background/10" : "bg-accent"}`}>
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate">{anexo.nome}</span>
        <span className={`block text-[9.5px] ${mine ? "text-background/60" : "text-muted-foreground"}`}>{tamanho(anexo.tamanho)}</span>
      </span>
    </a>
  );
}
