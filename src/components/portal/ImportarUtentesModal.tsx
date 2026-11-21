import { useState } from "react";
import { Upload } from "lucide-react";
import { useT } from "@/lib/i18n";
import { ModalActions, PrimaryButton, SecondaryButton, SimpleModal } from "@/components/portal/SimpleModal";
import { FundamentoLegalDialog } from "@/components/dashboard/FundamentoLegalDialog";
import { interpretarImportacao, type UtenteImportado } from "@/lib/exportacao";
import { criarUtentes } from "@/lib/dados";
import { useSessao } from "@/lib/sessao";

const MAX_FICHEIRO = 5 * 1024 * 1024;
const MAX_UTENTES = 2000;

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
  const tc = useT().conta;
  const { atual } = useSessao();
  const [lidos, setLidos] = useState<UtenteImportado[] | null>(null);
  const [ignoradas, setIgnoradas] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<(UtenteImportado & { id: string })[] | null>(null);

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
    if (!r.ok || r.utentes.length === 0 || r.utentes.length > MAX_UTENTES) {
      setErro(t.formatoInvalido);
      return;
    }
    setLidos(r.utentes);
    setIgnoradas(r.ignoradas);
  }

  async function confirmar() {
    if (!pendentes || !atual) return;
    try {
      await criarUtentes(atual.espaco_id, atual.id, pendentes);
      const n = pendentes.length;
      fechar();
      onImportados?.(n);
    } catch {
      setPendentes(null);
      setErro(tc.erroGenerico);
    }
  }

  return (
    <SimpleModal open={open} onClose={fechar} title={t.importarTitulo} description={t.importarAjuda} width="sm">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-foreground hover:bg-accent/40 focus-within:ring-1 focus-within:ring-ring">
        <Upload className="h-5 w-5 text-muted-foreground" />
        {t.escolherFicheiro}
        <input type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(e) => ler(e.target.files?.[0])} />
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
            {lidos.slice(0, 200).map((u, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-border px-3 py-1.5 last:border-0">
                <span>{u.nome}</span>
                <span className="text-muted-foreground">{[u.data_nascimento, u.sexo, u.cidade].filter(Boolean).join(" · ") || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ModalActions>
        <SecondaryButton onClick={fechar}>{t.cancelar}</SecondaryButton>
        {lidos && (
          <PrimaryButton onClick={() => setPendentes(lidos.map((u) => ({ ...u, id: crypto.randomUUID() })))}>
            {t.continuar}
          </PrimaryButton>
        )}
      </ModalActions>
      <FundamentoLegalDialog
        open={pendentes !== null}
        utenteRefs={pendentes?.map((p) => p.id) ?? []}
        onConfirm={confirmar}
        onCancel={() => setPendentes(null)}
      />
    </SimpleModal>
  );
}
