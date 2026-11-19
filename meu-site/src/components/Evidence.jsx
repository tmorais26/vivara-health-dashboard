import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

// Números retirados dos resumos originais (verificados na Europe PMC).
const T = {
  pt: {
    badge: "A evidência",
    title: (
      <>
        Não é só uma sensação. <em>Está estudado.</em>
      </>
    ),
    items: [
      {
        value: "13,6%",
        text: "das consultas de cuidados primários decorreram sem informação clínica importante. Em mais de metade dos casos, ela existia — mas estava fora do sistema da clínica.",
        source: "Smith PC et al., JAMA, 2005",
        url: "https://doi.org/10.1001/jama.293.5.565",
      },
      {
        value: "7,1%",
        text: "dos resultados de análises alterados não foram comunicados ao doente, ou não ficou registo de o terem sido.",
        source: "Casalino LP et al., Arch Intern Med, 2009",
        url: "https://doi.org/10.1001/archinternmed.2009.130",
      },
      {
        value: "8% → 5%",
        text: "dos exames de imagem repetidos em 90 dias, quando o médico passou a consultar o historial partilhado do doente.",
        source: "Vest JR et al., Am J Manag Care, 2014",
        url: "https://pubmed.ncbi.nlm.nih.gov/25811815/",
      },
    ],
    note: "Estudos realizados nos EUA, em cuidados primários e ambulatórios.",
  },
  en: {
    badge: "The evidence",
    title: (
      <>
        It's not just a feeling. <em>It's been studied.</em>
      </>
    ),
    items: [
      {
        value: "13.6%",
        text: "of primary care visits took place without important clinical information. In more than half of those cases, it existed — but sat outside the clinic's own system.",
        source: "Smith PC et al., JAMA, 2005",
        url: "https://doi.org/10.1001/jama.293.5.565",
      },
      {
        value: "7.1%",
        text: "of abnormal lab results were not communicated to the patient, or there was no record that they had been.",
        source: "Casalino LP et al., Arch Intern Med, 2009",
        url: "https://doi.org/10.1001/archinternmed.2009.130",
      },
      {
        value: "8% → 5%",
        text: "of imaging tests were repeated within 90 days once the doctor accessed the patient's shared record.",
        source: "Vest JR et al., Am J Manag Care, 2014",
        url: "https://pubmed.ncbi.nlm.nih.gov/25811815/",
      },
    ],
    note: "Studies conducted in the US, in primary and ambulatory care.",
  },
};

export default function Evidence() {
  const t = useT();
  const L = t(T);
  return (
    <section id="evidencia" className="bg-brand-dark text-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge tone="dark">{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">
            {L.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {L.items.map((it, i) => (
            <Reveal key={it.source} delay={i * 0.1}>
              <div className="h-full border-l-2 border-brand-lime pl-6">
                <p className="font-serif font-light leading-none tracking-tight text-5xl md:text-6xl">
                  {it.value}
                </p>
                <p className="mt-4 text-white/75 leading-relaxed">{it.text}</p>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-white/45 underline underline-offset-2 hover:text-white/80"
                >
                  {it.source}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-12 text-xs text-white/40">{L.note}</p>
      </div>
    </section>
  );
}
