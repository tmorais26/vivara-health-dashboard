import { useState } from "react";
import { Send } from "lucide-react";
import {
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
} from "@/components/portal/SimpleModal";
import { convidarUtenteApp, type EstadoConvite } from "@/lib/convite.functions";
import { useT } from "@/lib/i18n";
import type { UtenteDb } from "@/lib/dados";

// Convite por email para a app do utente. Só o utente beneficia; o médico não recebe nada.
export function ConvidarApp({ utente }: { utente: UtenteDb }) {
  const t = useT();
  const tr = t.recomendar;
  const [open, setOpen] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [estado, setEstado] = useState<EstadoConvite | null>(null);

  const mensagens: Record<EstadoConvite, string> = {
    ok: tr.conviteEnviado,
    sem_email: tr.conviteSemEmail,
    nao_configurado: tr.conviteNaoConfigurado,
    ja_enviado: tr.conviteJaEnviado,
    erro: tr.conviteErro,
  };

  async function enviar() {
    setAEnviar(true);
    try {
      const r = await convidarUtenteApp({ data: { utenteId: utente.id } });
      setEstado(r.estado);
    } catch {
      setEstado("erro");
    } finally {
      setAEnviar(false);
    }
  }

  function abrir() {
    setEstado(utente.email ? null : "sem_email");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent"
      >
        <Send className="h-3.5 w-3.5" />
        {tr.convidarApp}
      </button>
      <SimpleModal
        open={open}
        onClose={() => setOpen(false)}
        title={tr.convidarAppTitulo}
        width="sm"
      >
        {utente.email && (
          <p className="text-sm text-foreground">{tr.convidarAppTexto(utente.email)}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{tr.convidarAppNota}</p>
        {estado && (
          <p
            role={estado === "ok" ? "status" : "alert"}
            className={`mt-3 text-sm ${estado === "ok" ? "text-state-ok" : "text-state-alert"}`}
          >
            {mensagens[estado]}
          </p>
        )}
        <ModalActions>
          <SecondaryButton onClick={() => setOpen(false)}>
            {estado === "ok" ? t.comum.fechar : tr.cancelar}
          </SecondaryButton>
          {estado !== "ok" && utente.email && (
            <PrimaryButton onClick={() => void enviar()}>
              {aEnviar ? t.conta.aProcessar : tr.enviar}
            </PrimaryButton>
          )}
        </ModalActions>
      </SimpleModal>
    </>
  );
}
