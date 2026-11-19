import { useState } from "react";
import { Upload } from "lucide-react";
import { useT } from "@/lib/i18n";
import { ModalActions, PrimaryButton, SecondaryButton, SimpleModal } from "@/components/portal/SimpleModal";
import { FundamentoLegalDialog } from "@/components/dashboard/FundamentoLegalDialog";
import { idDeNome, iniciaisDe, interpretarImportacao, type UtenteImportado } from "@/lib/exportacao";
import { adicionarUtentes } from "@/lib/utentes-store";
import { definirClinica } from "@/lib/utente-clinica";
import type { ResumoUtente } from "@/data/mock-portal";

const MAX_FICHEIRO = 5 * 1024 * 1024;

export function ImportarUtentesModal({
  open,
  onClose,
  onImportados,
}: {
  open: boolean;
  onClose: () => void;
  onImportados?: (n: number) => void;
}) {
  const t = useT().dados;
  const [lidos, setLidos] = useState<UtenteImportado[] | null>(null);
  const [ignoradas, setIgnoradas] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<{ resumo: ResumoUtente; clinica?: string }[] | null>(null);

  function fechar() {
    setLidos(null);
    setIgnoradas(0);
    setErro(null);
    setPendentes(null);
    onClose();
  }

  async function ler(file: File | undefined) {
    setErro(null);
    setLidos(null);
    if (!file) return;
    if (file.size > MAX_FICHEIRO) {
      setErro(t.formatoInvalido);
      return;
    }
    const r = interpretarImportacao(await file.text(), file.name);
    if (!r.ok || r.utentes.length === 0) {
      setErro(t.formatoInvalido);
      return;
    }
    setLidos(r.utentes);
    setIgnoradas(r.ignoradas);
  }

  function continuar() {
    if (!lidos) return;
    setPendentes(
      lidos.map(({ clinica, ...u }) => ({
        resumo: { ...u, id: idDeNome(u.nome), iniciais: iniciaisDe(u.nome) },
        clinica,
      })),
    );
  }

  function confirmar() {
    if (!pendentes) return;
    adicionarUtentes(pendentes.map((p) => p.resumo));
    for (const p of pendentes) if (p.clinica) definirClinica(p.resumo.id, p.clinica);
    onImportados?.(pendentes.length);
    fechar();
  }

  return (
    <SimpleModal open={open} onClose={fechar} title={t.importarTitulo} description={t.importarAjuda} width="sm">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-foreground hover:bg-accent/40 focus-within:ring-1 focus-within:ring-ring">
        <Upload className="h-5 w-5 text-muted-foreground" />
        {t.escolherFicheiro}
        <input
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="sr-only"
          onChange={(e) => ler(e.target.files?.[0])}
        />
      </label>
      {erro && (
        <p role="alert" className="mt-3 text-xs text-state-alert">
          {erro}
        </p>
      )}
      {lidos && (
        <div role="status" className="mt-3 text-sm text-foreground">
          <p>{t.encontrados(lidos.length)}</p>
          {ignoradas > 0 && <p className="text-xs text-muted-foreground">{t.linhasIgnoradas(ignoradas)}</p>}
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border text-xs">
            {lidos.map((u, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-border px-3 py-1.5 last:border-0">
                <span>{u.nome}</span>
                <span className="text-muted-foreground">
                  {u.idade || "—"} · {u.sexo}
                  {u.clinica ? ` · ${u.clinica}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ModalActions>
        <SecondaryButton onClick={fechar}>{t.cancelar}</SecondaryButton>
        {lidos && <PrimaryButton onClick={continuar}>{t.continuar}</PrimaryButton>}
      </ModalActions>
      <FundamentoLegalDialog
        open={pendentes !== null}
        utenteRefs={pendentes?.map((p) => p.resumo.id) ?? []}
        onConfirm={confirmar}
        onCancel={() => setPendentes(null)}
      />
    </SimpleModal>
  );
}
