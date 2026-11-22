import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import {
  Field,
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
  inputClass,
} from "@/components/portal/SimpleModal";
import { useIdioma, useT } from "@/lib/i18n";
import { e_admin, iniciais, useSessao } from "@/lib/sessao";
import {
  dataHora,
  membrosDoEspaco,
  rotuloMembro,
  type MembroDb,
  type PedidoExportacaoDb,
} from "@/lib/dados";

export const Route = createFileRoute("/equipa")({
  head: () => ({ meta: [{ title: "Equipa — Vivara Health" }] }),
  component: EquipaPage,
});

function EquipaPage() {
  const t = useT();
  const te = t.equipa;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const admin = e_admin(atual);
  const souDona = atual?.papel_admin === "dona";
  const [membros, setMembros] = useState<MembroDb[]>([]);
  const [pedidos, setPedidos] = useState<PedidoExportacaoDb[]>([]);
  const [nomesUtentes, setNomesUtentes] = useState<Map<string, string>>(new Map());
  const [convidarOpen, setConvidarOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!atual) return;
    setMembros(await membrosDoEspaco(atual.espaco_id));
    if (!admin) return;
    const { data } = await supabase
      .from("pedidos_exportacao")
      .select("*")
      .eq("espaco_id", atual.espaco_id)
      .order("criado_em", { ascending: false })
      .limit(50);
    setPedidos(data ?? []);
    const ids = [...new Set((data ?? []).map((p) => p.utente_id).filter((x): x is string => !!x))];
    if (ids.length) {
      const { data: us } = await supabase.from("utentes").select("id, nome").in("id", ids);
      setNomesUtentes(new Map((us ?? []).map((u) => [u.id, u.nome])));
    }
  }, [atual, admin]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const rot = { medico: t.ficha.medico, administrativo: t.ficha.administrativo };
  const nomeDe = (id: string | null) => {
    const m = membros.find((x) => x.id === id);
    return m ? m.nome_exibicao : "—";
  };

  async function chamar(fn: PromiseLike<{ error: unknown }>) {
    setErro(null);
    const { error } = await fn;
    if (error) setErro(t.conta.erroGenerico);
    void carregar();
  }

  if (atual?.espaco.tipo !== "clinica") {
    return (
      <PortalShell>
        <main className="px-6 py-16 text-center text-sm text-muted-foreground">{te.soClinica}</main>
        <MobileNavTabs />
      </PortalShell>
    );
  }

  const pendentes = pedidos.filter((p) => p.estado === "pendente");
  const decididos = pedidos.filter((p) => p.estado !== "pendente").slice(0, 10);

  return (
    <PortalShell>
      <main className="mx-auto max-w-[960px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {atual.espaco.nome}
            </div>
            <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">{te.titulo}</h1>
          </div>
          {admin && (
            <button
              type="button"
              onClick={() => setConvidarOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {te.convidar}
            </button>
          )}
        </div>
        {!admin && <p className="mb-4 text-xs text-muted-foreground">{te.soAdmin}</p>}
        {erro && (
          <p role="alert" className="mb-4 text-sm text-state-alert">
            {erro}
          </p>
        )}

        {admin && (
          <section className="mb-6">
            <h2 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              {te.pedidos}
            </h2>
            {pendentes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-raised px-5 py-4 text-sm text-muted-foreground">
                {te.semPedidos}
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
                {pendentes.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground">
                        {te.pedidoDe(nomeDe(p.requerente_id))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.ambito === "tudo"
                          ? te.ambitoTudo
                          : te.ambitoUtente(nomesUtentes.get(p.utente_id ?? "") ?? "—")}{" "}
                        · {dataHora(p.criado_em, idioma)}
                        {p.motivo ? ` · ${p.motivo}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        chamar(
                          supabase.rpc("decidir_exportacao", { p_pedido: p.id, p_aprovar: false }),
                        )
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      {te.recusar}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        chamar(
                          supabase.rpc("decidir_exportacao", { p_pedido: p.id, p_aprovar: true }),
                        )
                      }
                      className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                    >
                      {te.aprovar}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {decididos.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {te.historico}
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {decididos.map((p) => (
                    <li key={p.id}>
                      {nomeDe(p.requerente_id)} ·{" "}
                      {p.ambito === "tudo"
                        ? te.ambitoTudo
                        : te.ambitoUtente(nomesUtentes.get(p.utente_id ?? "") ?? "—")}{" "}
                      ·{" "}
                      {p.estado === "aprovado"
                        ? te.aprovado
                        : p.estado === "recusado"
                          ? te.recusado
                          : te.usado}
                      {p.decidido_por ? ` (${nomeDe(p.decidido_por)})` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {admin && <ResumoRecomendacoesClinica espacoId={atual.espaco_id} />}

        <section>
          <h2 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            {te.membros}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
            {membros.map((m) => {
              const eu = m.id === atual.id;
              const podeGerir =
                admin &&
                !eu &&
                m.papel_admin !== "dona" &&
                (m.papel_admin !== "manager" || souDona);
              return (
                <li
                  key={m.id}
                  className={`flex flex-wrap items-center gap-3 px-5 py-3 ${m.estado === "bloqueado" ? "opacity-60" : ""}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground">
                    {iniciais(m.nome_exibicao)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">
                      {rotuloMembro(m, rot)}
                      {eu && <span className="text-muted-foreground"> ({te.tu})</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                      {m.papel_admin && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-foreground">
                          {m.papel_admin === "dona" ? te.dona : te.manager}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 ${m.estado === "ativo" ? "bg-state-ok-soft text-state-ok" : "bg-state-alert-soft text-state-alert"}`}
                      >
                        {m.estado === "ativo" ? te.ativo : te.bloqueado}
                      </span>
                    </div>
                  </div>
                  {souDona && !eu && m.papel_admin !== "dona" && (
                    <button
                      type="button"
                      onClick={() =>
                        chamar(
                          supabase.rpc("definir_manager", {
                            p_membro: m.id,
                            p_manager: m.papel_admin !== "manager",
                          }),
                        )
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      {m.papel_admin === "manager" ? te.retirarManager : te.tornarManager}
                    </button>
                  )}
                  {podeGerir && (
                    <button
                      type="button"
                      onClick={() =>
                        chamar(
                          supabase.rpc("definir_estado_membro", {
                            p_membro: m.id,
                            p_estado: m.estado === "ativo" ? "bloqueado" : "ativo",
                          }),
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-xs ${m.estado === "ativo" ? "text-state-alert hover:bg-state-alert-soft" : "border border-border text-foreground hover:bg-accent"}`}
                    >
                      {m.estado === "ativo" ? te.bloquear : te.desbloquear}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <MobileNavTabs />
      {admin && (
        <ConvidarModal
          open={convidarOpen}
          onClose={() => setConvidarOpen(false)}
          espacoId={atual.espaco_id}
          onAdicionado={carregar}
        />
      )}
    </PortalShell>
  );
}

// Só totais da equipa: nunca quem recomendou nem quem entrou.
function ResumoRecomendacoesClinica({ espacoId }: { espacoId: string }) {
  const tr = useT().recomendar;
  const [r, setR] = useState<{ profissionais: number; utentes: number; medicos: number } | null>(
    null,
  );
  useEffect(() => {
    void supabase.rpc("resumo_recomendacoes_clinica", { p_espaco: espacoId }).then(({ data }) => {
      setR((data as { profissionais: number; utentes: number; medicos: number } | null) ?? null);
    });
  }, [espacoId]);
  if (!r) return null;
  return (
    <section className="mb-6 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {tr.clinicaTitulo}
      </h2>
      <p className="mt-2 text-sm text-foreground">
        {tr.clinicaTexto(r.profissionais, r.utentes, r.medicos)}
      </p>
    </section>
  );
}

function ConvidarModal({
  open,
  onClose,
  espacoId,
  onAdicionado,
}: {
  open: boolean;
  onClose: () => void;
  espacoId: string;
  onAdicionado: () => void;
}) {
  const t = useT();
  const te = t.equipa;
  const tc = t.comecar;
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState<"medico" | "profissional" | "administrativo">("medico");
  const [profissao, setProfissao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      !nome.trim() ||
      (funcao === "profissional" && !profissao.trim())
    ) {
      return setErro(t.conta.erroObrigatorio);
    }
    setAGuardar(true);
    const { error } = await supabase.rpc("convidar_membro", {
      p_espaco: espacoId,
      p_email: email.trim(),
      p_nome_exibicao: nome.trim(),
      p_funcao: funcao,
      p_profissao: funcao === "profissional" ? profissao.trim() : undefined,
    });
    setAGuardar(false);
    if (error) {
      const m = error.message ?? "";
      return setErro(
        m.includes("Não existe conta")
          ? te.erroConta
          : m.includes("duplicate")
            ? te.erroJaMembro
            : t.conta.erroGenerico,
      );
    }
    setEmail("");
    setNome("");
    setProfissao("");
    setErro(null);
    onClose();
    onAdicionado();
  }

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={te.convidar}
      description={te.convidarTexto}
      width="sm"
    >
      <form onSubmit={adicionar} noValidate className="space-y-3">
        <Field label={te.email}>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label={te.nome}>
          <input
            className={inputClass}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label={te.funcao}>
          <select
            className={inputClass}
            value={funcao}
            onChange={(e) => setFuncao(e.target.value as typeof funcao)}
          >
            <option value="medico">{tc.funcaoMedico}</option>
            <option value="profissional">{tc.funcaoProfissional}</option>
            <option value="administrativo">{t.ficha.administrativo}</option>
          </select>
        </Field>
        {funcao === "profissional" && (
          <Field label={te.profissao}>
            <input
              className={inputClass}
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              placeholder={tc.profissaoPlaceholder}
            />
          </Field>
        )}
        {erro && (
          <p role="alert" className="text-xs text-state-alert">
            {erro}
          </p>
        )}
        <ModalActions>
          <SecondaryButton onClick={onClose}>{te.cancelar}</SecondaryButton>
          <PrimaryButton type="submit">
            {aGuardar ? t.conta.aProcessar : te.adicionar}
          </PrimaryButton>
        </ModalActions>
      </form>
    </SimpleModal>
  );
}
