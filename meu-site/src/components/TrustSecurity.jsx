import { SectionBadge, Reveal, Check } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "Confiança & Segurança",
    title: (
      <>
        Os seus dados. <em>O seu controlo.</em>
      </>
    ),
    items: [
      "Os seus dados são seus — exportáveis a qualquer momento",
      "Só o médico que escolher tem acesso",
      "Cumprimos o RGPD, incluindo o Artigo 9.º para dados de saúde",
      "Nunca vendemos os seus dados a terceiros",
    ],
  },
  en: {
    badge: "Trust & Security",
    title: (
      <>
        Your data. <em>Your control.</em>
      </>
    ),
    items: [
      "Your data is yours — exportable at any time",
      "Only the doctor you choose has access",
      "We comply with the GDPR, including Article 9 for health data",
      "We never sell your data to third parties",
    ],
  },
};

function CheckBadge() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-lime">
      <Check className="size-4 text-brand-green-dark" />
    </span>
  );
}

export default function TrustSecurity() {
  const t = useT();
  const L = t(T);

  return (
    <section id="seguranca" className="bg-[#f2f5ee] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-2xl">
            {L.title}
          </h2>
        </Reveal>

        <div className="mt-12 max-w-3xl space-y-3">
          {L.items.map((item, i) => (
            <Reveal key={item} delay={i * 0.08}>
              <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.15)]">
                <CheckBadge />
                <p className="text-brand-muted/85 leading-relaxed">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
