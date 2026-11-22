import { useState } from "react";
import { Field, ModalActions, PrimaryButton, SecondaryButton, SimpleModal, inputClass } from "@/components/portal/SimpleModal";
import { FundamentoLegalDialog } from "@/components/dashboard/FundamentoLegalDialog";
import { useT } from "@/lib/i18n";
import { e_clinico, useSessao } from "@/lib/sessao";
import { criarUtente, type NovoUtente } from "@/lib/dados";

const VAZIO = { nome: "", data_nascimento: "", sexo: "", telefone: "", email: "", cidade: "", clinica_onde_visto: "" };

export function NovoUtenteModal({ open, onClose, onCriado }: { open: boolean; onClose: () => void; onCriado: (id: string) => void }) {
  const t = useT();
  const tu = t.utentes;
  const { atual } = useSessao();
  const clinico = e_clinico(atual);
  const individual = atual?.espaco.tipo === "individual";
  const [f, setF] = useState(VAZIO);
  const [chat, setChat] = useState(false);
  const [erros, setErros] = useState<Partial<Record<keyof typeof VAZIO, string>>>({});
  const [pendente, setPendente] = useState<(NovoUtente & { id: string }) | null>(null);
  const [erroGravar, setErroGravar] = useState<string | null>(null);

  const set = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  function fechar() {
    setF(VAZIO);
    setChat(false);
    setErros({});
    setErroGravar(null);
    setPendente(null);
    onClose();
  }

  function validar() {
    const e: typeof erros = {};
    if (!f.nome.trim()) e.nome = t.conta.erroObrigatorio;
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t.conta.erroEmail;
    if (f.data_nascimento && new Date(f.data_nascimento) > new Date()) e.data_nascimento = t.conta.erroGenerico;
    setErros(e);
    if (Object.keys(e).length) return;
    setErroGravar(null);
    setPendente({
      id: crypto.randomUUID(),
      nome: f.nome.trim(),
      data_nascimento: f.data_nascimento || null,
      sexo: f.sexo || null,
      telefone: f.telefone.trim() || null,
      email: f.email.trim() || null,
      cidade: f.cidade.trim() || null,
      clinica_onde_visto: individual ? f.clinica_onde_visto.trim() || null : null,
      chat_estado: clinico && chat ? "ativo" : "desativado",
    });
  }

  async function gravar() {
    if (!pendente || !atual) return;
    try {
      await criarUtente(atual.espaco_id, atual.id, pendente);
      const id = pendente.id;
      fechar();
      onCriado(id);
    } catch {
      setPendente(null);
      setErroGravar(t.conta.erroGenerico);
    }
  }

  return (
    <SimpleModal open={open} onClose={fechar} title={tu.novoTitulo} description={tu.novoDescricao} width="md">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          validar();
        }}
        className="space-y-4"
      >
        <Field label={`${tu.nomeCompleto} *`}>
          <input className={inputClass} value={f.nome} onChange={set("nome")} autoComplete="off" aria-invalid={!!erros.nome} />
          {erros.nome && <span role="alert" className="mt-1 block text-xs text-state-alert">{erros.nome}</span>}
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tu.dataNascimento}>
            <input type="date" className={inputClass} value={f.data_nascimento} onChange={set("data_nascimento")} max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <fieldset>
            <legend className="text-[11px] uppercase tracking-wider text-muted-foreground">{tu.sexo}</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  ["F", tu.sexoF],
                  ["M", tu.sexoM],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium ${
                    f.sexo === v ? "border-foreground/40 bg-accent text-foreground" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <input type="radio" name="sexo" value={v} checked={f.sexo === v} onChange={() => setF((x) => ({ ...x, sexo: v }))} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tu.telefone}>
            <input type="tel" className={inputClass} value={f.telefone} onChange={set("telefone")} autoComplete="off" />
          </Field>
          <Field label={tu.email}>
            <input type="email" className={inputClass} value={f.email} onChange={set("email")} autoComplete="off" aria-invalid={!!erros.email} />
            {erros.email && <span role="alert" className="mt-1 block text-xs text-state-alert">{erros.email}</span>}
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tu.cidade}>
            <input className={inputClass} value={f.cidade} onChange={set("cidade")} />
          </Field>
          {individual && (
            <Field label={t.clinicaUtente.label}>
              <input className={inputClass} value={f.clinica_onde_visto} onChange={set("clinica_onde_visto")} placeholder={t.clinicaUtente.placeholder} />
            </Field>
          )}
        </div>
        {clinico && (
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5">
            <input id="novo-utente-chat" type="checkbox" checked={chat} onChange={(e) => setChat(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-foreground" />
            <label htmlFor="novo-utente-chat" className="text-sm text-foreground">
              {t.chat.ativarNoRegisto}
              <span className="block text-[11px] text-muted-foreground">{t.chat.ativarNoRegistoAjuda}</span>
            </label>
          </div>
        )}
        {erroGravar && (
          <p role="alert" className="text-xs text-state-alert">
            {erroGravar}
          </p>
        )}
        <ModalActions>
          <SecondaryButton onClick={fechar}>{tu.cancelar}</SecondaryButton>
          <PrimaryButton type="submit">{tu.criar}</PrimaryButton>
        </ModalActions>
      </form>
      <FundamentoLegalDialog
        open={pendente !== null}
        utenteRefs={pendente ? [pendente.id] : []}
        onConfirm={gravar}
        onCancel={() => setPendente(null)}
      />
    </SimpleModal>
  );
}
