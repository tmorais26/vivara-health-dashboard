import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { formatarData } from "@/data/mock-utente";
import { useT } from "@/lib/i18n";
import { definirClinica, useClinicasConhecidas, useClinicaUtente } from "@/lib/utente-clinica";
import { Field, ModalActions, PrimaryButton, SecondaryButton, SimpleModal, inputClass } from "@/components/portal/SimpleModal";

export function ClinicaUtenteChip({ utenteId, utenteNome }: { utenteId: string; utenteNome: string }) {
  const t = useT().clinicaUtente;
  const clinica = useClinicaUtente(utenteId);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t.editar}
        aria-label={`${t.editar}: ${clinica?.atual || t.vazio}`}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-foreground hover:bg-accent"
      >
        <Building2 className="h-3 w-3 text-muted-foreground" />
        {clinica?.atual || t.vazio}
        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
      </button>
      {open && (
        <ClinicaUtenteModal open onClose={() => setOpen(false)} utenteId={utenteId} utenteNome={utenteNome} />
      )}
    </>
  );
}

function ClinicaUtenteModal({
  open,
  onClose,
  utenteId,
  utenteNome,
}: {
  open: boolean;
  onClose: () => void;
  utenteId: string;
  utenteNome: string;
}) {
  const t = useT().clinicaUtente;
  const clinica = useClinicaUtente(utenteId);
  const conhecidas = useClinicasConhecidas();
  const [valor, setValor] = useState(clinica?.atual ?? "");

  return (
    <SimpleModal open={open} onClose={onClose} title={t.titulo} description={`${utenteNome} · ${t.descricao}`} width="sm">
      <Field label={t.label}>
        <input
          className={inputClass}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={t.placeholder}
          list="clinicas-conhecidas"
          autoFocus
        />
        <datalist id="clinicas-conhecidas">
          {conhecidas.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      {clinica && clinica.historico.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.historico}</div>
          <ul className="mt-1.5 space-y-1 text-sm">
            {[...clinica.historico].reverse().map((h, i) => (
              <li key={i} className="flex justify-between gap-3 text-foreground">
                <span>{h.clinica}</span>
                <span className="text-xs text-muted-foreground">{t.desde(formatarData(h.desde))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ModalActions>
        <SecondaryButton onClick={onClose}>{t.cancelar}</SecondaryButton>
        <PrimaryButton
          onClick={() => {
            definirClinica(utenteId, valor);
            onClose();
          }}
        >
          {t.guardar}
        </PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}
