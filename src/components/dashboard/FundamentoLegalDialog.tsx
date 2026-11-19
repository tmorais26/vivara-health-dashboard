import { useState } from "react";
import { ModalActions, PrimaryButton, SecondaryButton, SimpleModal } from "@/components/portal/SimpleModal";
import { useT } from "@/lib/i18n";
import { registarFundamentoUtente } from "@/lib/consent.functions";

export function FundamentoLegalDialog({
  open,
  utenteRef,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  utenteRef: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setLoading(true);
    setErro(null);
    try {
      await registarFundamentoUtente({ data: { utenteRef, texto: t.consent.fundamento } });
      onConfirm();
    } catch {
      setErro(t.conta.erroGenerico);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SimpleModal open={open} onClose={onCancel} title={t.consent.fundamentoTitulo} width="sm">
      <p className="text-sm text-foreground">{t.consent.fundamento}</p>
      {erro && (
        <p role="alert" className="mt-3 text-xs text-state-alert">
          {erro}
        </p>
      )}
      <ModalActions>
        <SecondaryButton onClick={onCancel}>{t.consent.cancelar}</SecondaryButton>
        <button
          type="button"
          onClick={confirmar}
          disabled={loading}
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.conta.aProcessar : t.consent.fundamentoConfirmar}
        </button>
      </ModalActions>
    </SimpleModal>
  );
}
