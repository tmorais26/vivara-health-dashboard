import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

// Números confirmados nas fontes originais: Perfil de Saúde do País 2025
// (OCDE e Observatório Europeu, PDF oficial em PT e EN) e Prior et al. 2023.
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
        value: "85–100%",
        text: "das análises clínicas e dos exames de radiologia em Portugal são feitos por prestadores privados — incluindo muitos dos que são pedidos pelo SNS.",
        source: "OCDE e Observatório Europeu dos Sistemas e Políticas de Saúde · Perfil de Saúde do País 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "3,7 milhões",
        text: "de pessoas — um terço da população — têm seguro de saúde. E o recurso a privados quando se está doente duplicou desde 2013.",
        source: "OCDE e Observatório Europeu dos Sistemas e Políticas de Saúde · Perfil de Saúde do País 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "40%",
        text: "dos adultos em Portugal já consultam o seu registo de saúde online — acima da média europeia, de 28%.",
        source: "OCDE e Observatório Europeu dos Sistemas e Políticas de Saúde · Perfil de Saúde do País 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "6,9",
        text: "prestadores diferentes num ano, em média, para quem tem seis doenças crónicas. Cuidados mais fragmentados estão associados a mais medicação inadequada e a maior mortalidade.",
        source: "Prior A et al. · BMC Medicine, 2023 · 4,7 milhões de adultos na Dinamarca",
        url: "https://doi.org/10.1186/s12916-023-03021-3",
      },
    ],
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
        value: "85–100%",
        text: "of laboratory and radiology tests in Portugal are performed by private providers — including many ordered by the national health service.",
        source: "OECD & European Observatory on Health Systems and Policies · Country Health Profile 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "3.7 million",
        text: "people — a third of the population — have private health insurance. And turning to private providers when ill has doubled since 2013.",
        source: "OECD & European Observatory on Health Systems and Policies · Country Health Profile 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "40%",
        text: "of adults in Portugal already access their health record online — above the EU average of 28%.",
        source: "OECD & European Observatory on Health Systems and Policies · Country Health Profile 2025: Portugal",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025",
      },
      {
        value: "6.9",
        text: "different providers in a year, on average, for people with six chronic conditions. More fragmented care is associated with more inappropriate medication and higher mortality.",
        source: "Prior A et al. · BMC Medicine, 2023 · 4.7 million adults in Denmark",
        url: "https://doi.org/10.1186/s12916-023-03021-3",
      },
    ],
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

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
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
      </div>
    </section>
  );
}
