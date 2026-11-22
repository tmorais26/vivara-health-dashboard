import { useT } from "@/lib/i18n";
import { LEGAL_DOCS } from "@/lib/legal-docs";

export type ConsentState = { documentos: boolean; habilitacao: boolean; marketing: boolean };

// Quem só trabalha na gestão/administração não declara habilitação profissional, mas sim o
// acesso limitado às suas funções e o dever de sigilo.
export function useConsentTextos(administrativo = false) {
  const c = useT().consent;
  return {
    documentos: `${c.aceitoPre}${c.termos}${c.aceitoMeio}${c.acordo}${c.aceitoPos}`,
    habilitacao: administrativo ? c.habilitacaoAdmin : c.habilitacao,
    marketing: c.marketing,
  };
}

function DocLink({ href, children }: { href: string; children: string }) {
  const t = useT();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-foreground underline underline-offset-2"
    >
      {children}
      <span className="sr-only"> {t.consent.novaTab}</span>
    </a>
  );
}

const boxClass = "mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-foreground";

export function ConsentFields({
  value,
  onChange,
  showErrors,
  includeMarketing = true,
  administrativo = false,
}: {
  value: ConsentState;
  onChange: (v: ConsentState) => void;
  showErrors: boolean;
  includeMarketing?: boolean;
  administrativo?: boolean;
}) {
  const c = useT().consent;
  const errDoc = showErrors && !value.documentos;
  const errHab = showErrors && !value.habilitacao;
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-start gap-2.5">
          <input
            id="consent-documentos"
            type="checkbox"
            className={boxClass}
            checked={value.documentos}
            onChange={(e) => onChange({ ...value, documentos: e.target.checked })}
            aria-required="true"
            aria-invalid={errDoc}
            aria-describedby={errDoc ? "consent-documentos-erro" : undefined}
          />
          <label htmlFor="consent-documentos" className="text-sm leading-snug text-foreground">
            {c.aceitoPre}
            <DocLink href={LEGAL_DOCS.termos.url}>{c.termos}</DocLink>
            {c.aceitoMeio}
            <DocLink href={LEGAL_DOCS.acordo.url}>{c.acordo}</DocLink>
            {c.aceitoPos}
          </label>
        </div>
        {errDoc && (
          <p
            id="consent-documentos-erro"
            role="alert"
            className="mt-1 pl-6 text-xs text-state-alert"
          >
            {c.erroObrigatoria}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-2.5">
          <input
            id="consent-habilitacao"
            type="checkbox"
            className={boxClass}
            checked={value.habilitacao}
            onChange={(e) => onChange({ ...value, habilitacao: e.target.checked })}
            aria-required="true"
            aria-invalid={errHab}
            aria-describedby={errHab ? "consent-habilitacao-erro" : undefined}
          />
          <label htmlFor="consent-habilitacao" className="text-sm leading-snug text-foreground">
            {administrativo ? c.habilitacaoAdmin : c.habilitacao}
          </label>
        </div>
        {errHab && (
          <p
            id="consent-habilitacao-erro"
            role="alert"
            className="mt-1 pl-6 text-xs text-state-alert"
          >
            {c.erroObrigatoria}
          </p>
        )}
      </div>

      {includeMarketing && (
        <div className="flex items-start gap-2.5">
          <input
            id="consent-marketing"
            type="checkbox"
            className={boxClass}
            checked={value.marketing}
            onChange={(e) => onChange({ ...value, marketing: e.target.checked })}
          />
          <label htmlFor="consent-marketing" className="text-sm leading-snug text-foreground">
            {c.marketing}
          </label>
        </div>
      )}
    </div>
  );
}

export function PrivacidadeInfo() {
  const c = useT().consent;
  return (
    <p className="mt-3 text-center text-xs text-muted-foreground">
      {c.privacidadePre}
      <DocLink href={LEGAL_DOCS.privacidade.url}>{c.privacidade}</DocLink>
      {c.privacidadePos}
    </p>
  );
}
