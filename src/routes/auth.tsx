import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { ArrowLeft, Building2, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setIdioma, useIdioma, useT } from "@/lib/i18n";
import {
  ConsentFields,
  PrivacidadeInfo,
  useConsentTextos,
  type ConsentState,
} from "@/components/auth/ConsentFields";
import { gravarAceitacao } from "@/lib/consent-client";
import { URL_APP_UTENTE } from "@/lib/legal-docs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Vivara Health" },
      { name: "description", content: "Acesso à plataforma Vivara Health." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { codigo?: string; saiu?: number } => ({
    ...(typeof s.codigo === "string" ? { codigo: s.codigo } : {}),
    ...(s.saiu ? { saiu: 1 } : {}),
  }),
  component: AuthPage,
});

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring aria-[invalid=true]:border-state-alert";

function TextField({
  label,
  error,
  help,
  ...props
}: {
  label: string;
  error?: string | null;
  help?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const erroId = `${id}-erro`;
  const ajudaId = `${id}-ajuda`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={
          [error ? erroId : null, help ? ajudaId : null].filter(Boolean).join(" ") || undefined
        }
        className={inputClass}
      />
      {help && (
        <p id={ajudaId} className="mt-1 text-[11px] text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={erroId} role="alert" className="mt-1 text-xs text-state-alert">
          {error}
        </p>
      )}
    </div>
  );
}

// O Supabase devolve mensagens em inglês; traduzimos pelos códigos de erro conhecidos.
function mensagemErroAuth(err: unknown, c: ReturnType<typeof useT>["conta"]): string {
  const e = err as { code?: string; status?: number; message?: string } | null;
  const code = e?.code ?? "";
  const msg = (e?.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return c.erroCredenciais;
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return c.erroEmailPorConfirmar;
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    msg.includes("already registered")
  )
    return c.erroContaExiste;
  if (
    code === "email_address_invalid" ||
    code === "email_address_not_authorized" ||
    msg.includes("is invalid")
  )
    return c.erroEmailInvalido;
  if (code === "weak_password" || msg.includes("password")) return c.erroPalavraPasseFraca;
  if (code.startsWith("over_") || e?.status === 429) return c.erroDemasiadasTentativas;
  if (msg.includes("failed to fetch") || msg.includes("network")) return c.erroLigacao;
  return c.erroGenerico;
}

type Erros = Partial<
  Record<
    "nome" | "email" | "palavraPasse" | "especialidade" | "cedula" | "profissao" | "nomeClinica",
    string
  >
>;
type Plano = "individual" | "clinica" | "convidado";
type Funcao = "medico" | "profissional" | "administrativo";

function AuthPage() {
  const t = useT();
  const idioma = useIdioma();
  const textos = useConsentTextos();
  const navigate = useNavigate();
  const { codigo: codigoUrl, saiu } = Route.useSearch();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [funcao, setFuncao] = useState<Funcao>("medico");
  const [profissao, setProfissao] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [mostrarCodigo, setMostrarCodigo] = useState(!!codigoUrl);
  const [mode, setMode] = useState<"login" | "signup" | "recuperar">(
    codigoUrl ? "signup" : "login",
  );
  const [codigoConvite, setCodigoConvite] = useState((codigoUrl ?? "").toUpperCase());
  const [codigoEstado, setCodigoEstado] = useState<"vazio" | "valido" | "invalido" | "a_verificar">(
    "vazio",
  );
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [cedula, setCedula] = useState("");
  const [clinica, setClinica] = useState("");
  const [consent, setConsent] = useState<ConsentState>({
    documentos: false,
    habilitacao: false,
    marketing: false,
  });
  const [tentou, setTentou] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(saiu ? t.conta.saiu : null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  // Validação em tempo real do código de convite (só diz se existe; não revela de quem é).
  useEffect(() => {
    const c = codigoConvite.trim();
    if (!c) return setCodigoEstado("vazio");
    if (!/^VIV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c))
      return setCodigoEstado(c.length >= 14 ? "invalido" : "a_verificar");
    setCodigoEstado("a_verificar");
    const id = setTimeout(async () => {
      const { data } = await supabase.rpc("validar_codigo", { p_codigo: c });
      setCodigoEstado(data ? "valido" : "invalido");
    }, 350);
    return () => clearTimeout(id);
  }, [codigoConvite]);

  const obrigatoriasOk = consent.documentos && consent.habilitacao;

  function validar(): Erros {
    const e: Erros = {};
    const req = t.conta.erroObrigatorio;
    if (mode === "signup") {
      if (!nome.trim()) e.nome = req;
      if (funcao === "medico") {
        if (!especialidade.trim()) e.especialidade = req;
        if (!cedula.trim()) e.cedula = req;
      }
      if (funcao === "profissional" && !profissao.trim()) e.profissao = req;
      if (plano === "clinica" && !nomeClinica.trim()) e.nomeClinica = req;
    }
    if (!email.trim()) e.email = req;
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t.conta.erroEmail;
    if (!password) e.palavraPasse = req;
    else if (mode === "signup" && password.length < 6) e.palavraPasse = t.conta.erroPalavraPasse;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setInfo(null);
    setTentou(true);
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;
    if (mode === "signup" && !obrigatoriasOk) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: "physician",
              full_name: nome.trim(),
              nome: nome.trim(),
              especialidade: funcao === "medico" ? especialidade.trim() : profissao.trim(),
              cedula: funcao === "administrativo" ? "" : cedula.trim(),
              clinica: plano === "clinica" ? nomeClinica.trim() : clinica.trim() || null,
              // Escolha do primeiro passo: o espaço de trabalho é criado sozinho no primeiro acesso.
              plano,
              funcao,
              profissao: funcao === "profissional" ? profissao.trim() : null,
              nome_clinica: plano === "clinica" ? nomeClinica.trim() : null,
              marketing_opt_in: consent.marketing,
              codigo_convite: codigoEstado === "valido" ? codigoConvite.trim() : null,
            },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          try {
            await gravarAceitacao(data.user, textos);
          } catch {
            setInfo(t.conta.erroAceitacao);
          }
          navigate({ to: "/" });
        } else {
          setInfo(t.conta.avisoConfirmarEmail);
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setError(mensagemErroAuth(err, t.conta));
    } finally {
      setLoading(false);
    }
  }

  function trocarModo(m: "login" | "signup" | "recuperar") {
    setMode(m);
    setPlano(null);
    setInfo(null);
    setError(null);
    setErros({});
    setTentou(false);
  }

  const desativado = loading || (mode === "signup" && !obrigatoriasOk);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
            <span className="font-serif text-lg text-foreground">Vivara Health</span>
          </Link>
          <div role="group" aria-label="Idioma / Language" className="flex gap-1 text-[11px]">
            {(["pt", "en"] as const).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdioma(i)}
                aria-pressed={idioma === i}
                className={`rounded-full px-2.5 py-1 font-medium uppercase ${
                  idioma === i
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
          <h1 className="font-serif text-2xl text-foreground">
            {mode === "login"
              ? t.conta.entrar
              : mode === "signup"
                ? t.conta.criarConta
                : t.conta.recuperarTitulo}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? t.conta.subEntrar
              : mode === "signup"
                ? plano
                  ? t.conta.subCriarDados
                  : t.conta.subCriar
                : t.conta.recuperarSub}
          </p>

          {mode === "recuperar" ? (
            <RecuperarPalavraPasse emailInicial={email} onVoltar={() => trocarModo("login")} />
          ) : mode === "signup" && !plano ? (
            <>
              <div className="mt-5 space-y-2">
                <OpcaoPlano
                  icon={<Stethoscope className="h-5 w-5" />}
                  titulo={t.comecar.individualTitulo}
                  texto={t.comecar.individualTexto}
                  onClick={() => {
                    setPlano("individual");
                    setFuncao("medico");
                  }}
                />
                <OpcaoPlano
                  icon={<Building2 className="h-5 w-5" />}
                  titulo={t.comecar.clinicaTitulo}
                  texto={t.comecar.clinicaTexto}
                  onClick={() => setPlano("clinica")}
                />
                <OpcaoPlano
                  icon={<Mail className="h-5 w-5" />}
                  titulo={t.comecar.convidadoTitulo}
                  texto={t.conta.convidadoTextoRegisto}
                  onClick={() => setPlano("convidado")}
                />
              </div>
              <div className="mt-4 text-center text-xs text-muted-foreground">
                {t.conta.temConta}{" "}
                <button
                  type="button"
                  onClick={() => trocarModo("login")}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {t.conta.entrar}
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
                {mode === "signup" && plano && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs">
                    <span className="text-foreground">
                      {plano === "individual"
                        ? t.comecar.individualTitulo
                        : plano === "clinica"
                          ? t.comecar.clinicaTitulo
                          : t.comecar.convidadoTitulo}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlano(null)}
                      className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      {t.conta.mudar}
                    </button>
                  </div>
                )}
                {mode === "signup" && plano !== "individual" && (
                  <fieldset>
                    <legend className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                      {plano === "clinica" ? t.comecar.suaFuncao : t.conta.suaProfissao}
                    </legend>
                    <div className="mt-1 grid gap-1.5">
                      {(
                        [
                          ["medico", t.comecar.funcaoMedico],
                          ["profissional", t.comecar.funcaoProfissional],
                          ["administrativo", t.comecar.funcaoAdministrativo],
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
                  </fieldset>
                )}
                {mode === "signup" && plano === "clinica" && (
                  <TextField
                    label={t.comecar.nomeClinica}
                    value={nomeClinica}
                    onChange={(e) => setNomeClinica(e.target.value)}
                    autoComplete="organization"
                    error={erros.nomeClinica}
                  />
                )}
                {mode === "signup" && (
                  <TextField
                    label={t.conta.nome}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    error={erros.nome}
                  />
                )}
                <TextField
                  label={t.conta.email}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="nome@exemplo.pt"
                  error={erros.email}
                />
                <TextField
                  label={t.conta.palavraPasse}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  error={erros.palavraPasse}
                />
                {mode === "login" && (
                  <div className="-mt-1 text-right">
                    <button
                      type="button"
                      onClick={() => trocarModo("recuperar")}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t.conta.esqueci}
                    </button>
                  </div>
                )}
                {mode === "signup" && (
                  <>
                    {funcao === "medico" && (
                      <>
                        <TextField
                          label={t.conta.especialidade}
                          value={especialidade}
                          onChange={(e) => setEspecialidade(e.target.value)}
                          error={erros.especialidade}
                        />
                        <TextField
                          label={t.conta.cedula}
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value)}
                          help={t.conta.cedulaAjuda}
                          error={erros.cedula}
                        />
                      </>
                    )}
                    {funcao === "profissional" && (
                      <>
                        <TextField
                          label={t.comecar.profissao}
                          value={profissao}
                          onChange={(e) => setProfissao(e.target.value)}
                          placeholder={t.comecar.profissaoPlaceholder}
                          error={erros.profissao}
                        />
                        <TextField
                          label={t.conta.cedulaOpcional}
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value)}
                          help={t.conta.cedulaAjuda}
                        />
                      </>
                    )}
                    {plano === "individual" && (
                      <TextField
                        label={t.conta.clinica}
                        value={clinica}
                        onChange={(e) => setClinica(e.target.value)}
                        help={t.conta.clinicaAjuda}
                      />
                    )}
                    {plano !== "convidado" &&
                      (mostrarCodigo ? (
                        <TextField
                          label={t.recomendar.codigoConvite}
                          value={codigoConvite}
                          onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
                          placeholder="VIV-XXXX-XXXX"
                          autoComplete="off"
                          spellCheck={false}
                          maxLength={14}
                          help={
                            codigoEstado === "valido"
                              ? t.recomendar.codigoValido
                              : t.recomendar.codigoAjuda
                          }
                          error={codigoEstado === "invalido" ? t.recomendar.codigoInvalido : null}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMostrarCodigo(true)}
                          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {t.conta.temCodigo}
                        </button>
                      ))}
                    <div className="pt-2">
                      <ConsentFields value={consent} onChange={setConsent} showErrors={tentou} />
                    </div>
                  </>
                )}

                {info && (
                  <div
                    role="status"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                  >
                    {info}
                  </div>
                )}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-state-alert/30 bg-state-alert-soft px-3 py-2 text-xs text-state-alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={desativado}
                  className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading
                    ? t.conta.aProcessar
                    : mode === "login"
                      ? t.conta.entrar
                      : t.conta.criarConta}
                </button>
                {mode === "signup" && <PrivacidadeInfo />}
              </form>

              <div className="mt-4 text-center text-xs text-muted-foreground">
                {mode === "login" ? (
                  <>
                    {t.conta.semConta}{" "}
                    <button
                      type="button"
                      onClick={() => trocarModo("signup")}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {t.conta.criarConta}
                    </button>
                  </>
                ) : (
                  <>
                    {t.conta.temConta}{" "}
                    <button
                      type="button"
                      onClick={() => trocarModo("login")}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {t.conta.entrar}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-state-ok" />
          {t.conta.sessaoProtegida}
        </div>
        {mode === "login" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t.conta.eUtente}{" "}
            <a
              href={URL_APP_UTENTE}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {t.conta.irApp}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

function OpcaoPlano({
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
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-foreground">{titulo}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{texto}</span>
      </span>
    </button>
  );
}

function RecuperarPalavraPasse({
  emailInicial,
  onVoltar,
}: {
  emailInicial: string;
  onVoltar: () => void;
}) {
  const t = useT();
  const [email, setEmail] = useState(emailInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErro(t.conta.erroEmail);
      return;
    }
    setErro(null);
    setAEnviar(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-palavra-passe`,
    });
    setAEnviar(false);
    // Por privacidade, a mensagem é a mesma exista ou não conta com este email.
    if (error && (error.status === 429 || error.code?.startsWith("over_")))
      setErro(t.conta.erroDemasiadasTentativas);
    else setEnviado(true);
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-5 space-y-3">
      {enviado ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {t.conta.recuperarEnviado}
        </p>
      ) : (
        <>
          <TextField
            label={t.conta.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={erro}
          />
          <button
            type="submit"
            disabled={aEnviar}
            className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {aEnviar ? t.conta.aProcessar : t.conta.recuperarEnviar}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onVoltar}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        {t.conta.voltarEntrar}
      </button>
    </form>
  );
}
