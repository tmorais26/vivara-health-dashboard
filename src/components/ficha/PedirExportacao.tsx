import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Field, ModalActions, PrimaryButton, SecondaryButton, SimpleModal, inputClass } from "@/components/portal/SimpleModal";
import { exportarUtenteDb } from "@/lib/exportacao";
import { useIdioma, useT } from "@/lib/i18n";
import { useSessao } from "@/lib/sessao";
import { soData, type PedidoExportacaoDb, type UtenteDb } from "@/lib/dados";

// No Plano Médico exporta logo; na clínica pede autorização e só depois descarrega.
export function PedirExportacao({ utente }: { utente: UtenteDb }) {
  const t = useT();
  const te = t.exportacao;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [pedido, setPedido] = useState<PedidoExportacaoDb | null>(null);
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [aTrabalhar, setATrabalhar] = useState(false);
  const individual = atual?.espaco.tipo === "individual";

  const carregar = useCallback(async () => {
    if (!atual || individual) return;
    const { data } = await supabase
      .from("pedidos_exportacao")
      .select("*")
      .eq("requerente_id", atual.id)
      .eq("utente_id", utente.id)
      .order("criado_em", { ascending: false })
      .limit(1);
    setPedido(data?.[0] ?? null);
  }, [atual, individual, utente.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!atual) return null;

  async function exportar(pedidoId?: string) {
    if (!atual) return;
    setATrabalhar(true);
    setMsg(null);
    try {
      await exportarUtenteDb(atual.espaco_id, utente.id, pedidoId);
    } catch {
      setMsg(t.conta.erroGenerico);
    }
    setATrabalhar(false);
    void carregar();
  }

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    if (!atual) return;
    setATrabalhar(true);
    const { error } = await supabase.rpc("pedir_exportacao", {
      p_espaco: atual.espaco_id,
      p_ambito: "utente",
      p_utente: utente.id,
      p_motivo: motivo.trim() || undefined,
    });
    setATrabalhar(false);
    if (error) return setMsg(t.conta.erroGenerico);
    setAberto(false);
    setMotivo("");
    setMsg(te.enviado);
    void carregar();
  }

  const botao = "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50";
  const aprovadoValido = pedido?.estado === "aprovado" && pedido.expira_em && new Date(pedido.expira_em).getTime() > Date.now();

  return (
    <>
      {individual ? (
        <button type="button" disabled={aTrabalhar} onClick={() => exportar()} className={botao}>
          <Download className="h-3.5 w-3.5" />
          {te.exportar}
        </button>
      ) : aprovadoValido ? (
        <button type="button" disabled={aTrabalhar} onClick={() => exportar(pedido!.id)} className={botao} title={te.validoAte(soData(pedido!.expira_em!, idioma))}>
          <Download className="h-3.5 w-3.5" />
          {te.descarregar}
        </button>
      ) : pedido?.estado === "pendente" ? (
        <span className="inline-flex items-center rounded-full bg-state-warn-soft px-3.5 py-2 text-xs font-medium text-state-warn">{te.pendente}</span>
      ) : (
        <button type="button" onClick={() => setAberto(true)} className={botao} title={pedido?.estado === "recusado" ? te.recusado : undefined}>
          <Download className="h-3.5 w-3.5" />
          {te.pedir}
        </button>
      )}
      {msg && (
        <span role="status" className="text-xs text-muted-foreground">
          {msg}
        </span>
      )}
      <SimpleModal open={aberto} onClose={() => setAberto(false)} title={te.pedirTitulo} description={te.pedirTexto} width="sm">
        <form onSubmit={pedir} className="space-y-3">
          <Field label={te.motivo}>
            <input className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={te.motivoPlaceholder} maxLength={300} />
          </Field>
          <ModalActions>
            <SecondaryButton onClick={() => setAberto(false)}>{te.cancelar}</SecondaryButton>
            <PrimaryButton type="submit">{aTrabalhar ? t.conta.aProcessar : te.enviarPedido}</PrimaryButton>
          </ModalActions>
        </form>
      </SimpleModal>
    </>
  );
}
