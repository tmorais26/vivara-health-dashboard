import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Building2, Mail, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { nomeAtual, useSessao } from "@/lib/sessao";

export const Route = createFileRoute("/comecar")({
  head: () => ({ meta: [{ title: "Começar — Vivara Health" }] }),
  component: Comecar,
});

type Modo = "escolher" | "individual" | "clinica" | "convidado";
type Funcao = "medico" | "profissional" | "administrativo";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function Comecar() {
  const t = useT().comecar;
  const tc = useT().conta;
  const sessao = useSessao();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("escolher");
  const nomePessoa = nomeAtual(sessao);
  const [nome, setNome] = useState(sessao.perfil?.clinica ?? "");
  const [nomeExibicao, setNomeExibicao] = useState(nomePessoa);
  const [funcao, setFuncao] = useState<Funcao>("medico");
  const [profissao, setProfissao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [semConvite, setSemConvite] = useState(false);

  // Quem escolheu o tipo de conta no registo não volta a escolher: o espaço é criado sozinho.
  const meta = (sessao.user.user_metadata ?? {}) as Record<string, unknown>;
  const planoRegisto =
    meta.plano === "individual" || meta.plano === "clinica" || meta.plano === "convidado"
      ? meta.plano
      : null;
  const [automatico, setAutomatico] = useState(
    planoRegisto === "individual" || planoRegisto === "clinica",
  );
  const tentado = useRef(false);

  useEffect(() => {
    if (tentado.current || !planoRegisto) return;
    tentado.current = true;
    if (planoRegisto === "convidado") {
      setModo("convidado");
      return;
    }
    void (async () => {
      const funcaoRegisto: Funcao =
        planoRegisto === "individual"
          ? "medico"
          : ((meta.funcao as Funcao | undefined) ?? "medico");
      const nomeClinica = typeof meta.nome_clinica === "string" ? meta.nome_clinica.trim() : "";
      const { error } = await supabase.rpc("criar_espaco", {
        p_tipo: planoRegisto,
        p_nome:
          planoRegisto === "individual"
            ? sessao.perfil?.clinica || nomePessoa
            : nomeClinica || nomePessoa,
        p_nome_exibicao: nomePessoa,
        p_funcao: funcaoRegisto,
        p_profissao:
          funcaoRegisto === "profissional" && typeof meta.profissao === "string"
            ? meta.profissao
            : undefined,
      });
      if (error) {
        // Se falhar, mostra a escolha manual com os dados já preenchidos.
        setAutomatico(false);
        setModo(planoRegisto);
        if (planoRegisto === "clinica") setNome(nomeClinica);
        setFuncao(funcaoRegisto);
        return;
      }
      await supabase.auth.updateUser({
        data: { plano: null, funcao: null, profissao: null, nome_clinica: null },
      });
      await sessao.recarregar();
      navigate({ to: "/" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // À espera do convite: verifica sozinho de 20 em 20 segundos (sai desta página quando for adicionado).
  useEffect(() => {
    if (modo !== "convidado") return;
    const id = setInterval(() => void sessao.recarregar(), 20000);
    return () => clearInterval(id);
  }, [modo, sessao]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const tipo = modo === "individual" ? "individual" : "clinica";
    const nomeEspaco = nome.trim() || (tipo === "individual" ? nomePessoa : "");
    if (!nomeEspaco || !nomeExibicao.trim() || (funcao === "profissional" && !profissao.trim())) {
      setErro(tc.erroObrigatorio);
      return;
    }
    setAGuardar(true);
    const { error } = await supabase.rpc("criar_espaco", {
      p_tipo: tipo,
      p_nome: nomeEspaco,
      p_nome_exibicao: nomeExibicao.trim(),
      p_funcao: tipo === "individual" ? "medico" : funcao,
      p_profissao: funcao === "profissional" ? profissao.trim() : undefined,
    });
    if (error) {
      setErro(tc.erroGenerico);
      setAGuardar(false);
      return;
    }
    await sessao.recarregar();
    navigate({ to: "/" });
  }

  async function verificar() {
    await sessao.recarregar();
    setSemConvite(true);
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { saiu: 1 } });
  }

  if (automatico) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p role="status" className="text-sm text-muted-foreground">
          {t.aPreparar}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
          <span className="font-serif text-lg text-foreground">Vivara Health</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
          <h1 className="font-serif text-2xl text-foreground">{t.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>

          {modo === "escolher" && (
            <div className="mt-5 space-y-2">
              <Opcao
                icon={<Stethoscope className="h-5 w-5" />}
                titulo={t.individualTitulo}
                texto={t.individualTexto}
                onClick={() => setModo("individual")}
              />
              <Opcao
                icon={<Building2 className="h-5 w-5" />}
                titulo={t.clinicaTitulo}
                texto={t.clinicaTexto}
                onClick={() => {
                  setNome("");
                  setModo("clinica");
                }}
              />
              <Opcao
                icon={<Mail className="h-5 w-5" />}
                titulo={t.convidadoTitulo}
                texto={t.convidadoTexto(sessao.user.email ?? "")}
                onClick={() => setModo("convidado")}
              />
            </div>
          )}

          {(modo === "individual" || modo === "clinica") && (
            <form onSubmit={criar} noValidate className="mt-5 space-y-3">
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                {modo === "individual" ? t.nomeConsultorio : t.nomeClinica}
                <input
                  className={inputClass}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={modo === "individual" ? nomePessoa : ""}
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                {t.nomeExibicao}
                <input
                  className={inputClass}
                  value={nomeExibicao}
                  onChange={(e) => setNomeExibicao(e.target.value)}
                />
              </label>
              {modo === "clinica" && (
                <fieldset>
                  <legend className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t.suaFuncao}
                  </legend>
                  <div className="mt-1 grid gap-1.5">
                    {(
                      [
                        ["medico", t.funcaoMedico],
                        ["profissional", t.funcaoProfissional],
                        ["administrativo", t.funcaoAdministrativo],
                      ] as const
                    ).map(([id, label]) => (
                      <label
                        key={id}
                        className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <input
                          type="radio"
                          name="funcao"
                          checked={funcao === id}
                          onChange={() => setFuncao(id)}
                          className="accent-foreground"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {funcao === "profissional" && (
                    <label className="mt-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t.profissao}
                      <input
                        className={inputClass}
                        value={profissao}
                        onChange={(e) => setProfissao(e.target.value)}
                        placeholder={t.profissaoPlaceholder}
                      />
                    </label>
                  )}
                </fieldset>
              )}
              {erro && (
                <p role="alert" className="text-xs text-state-alert">
                  {erro}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setModo("escolher")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.voltar}
                </button>
                <button
                  type="submit"
                  disabled={aGuardar}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  {aGuardar ? tc.aProcessar : t.criar}
                </button>
              </div>
            </form>
          )}

          {modo === "convidado" && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-foreground">{t.convidadoTexto(sessao.user.email ?? "")}</p>
              {semConvite && (
                <p role="status" className="text-xs text-muted-foreground">
                  {t.aindaSemConvite}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setModo("escolher")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.voltar}
                </button>
                <button
                  type="button"
                  onClick={verificar}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
                >
                  {t.verificar}
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={sair}
          className="mx-auto mt-4 block text-xs text-muted-foreground hover:text-foreground"
        >
          {t.sair}
        </button>
      </div>
    </div>
  );
}

function Opcao({
  icon,
  titulo,
  texto,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/40"
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-foreground">{titulo}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{texto}</span>
      </span>
    </button>
  );
}
