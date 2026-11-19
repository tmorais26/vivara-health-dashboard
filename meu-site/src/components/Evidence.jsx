import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

// Números confirmados nas fontes originais (PDF oficial e resumos na Europe PMC).
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
        value: "29%",
        text: "da despesa em saúde em Portugal é paga diretamente pelas famílias — o dobro da média da UE. Os cuidados repartem-se entre SNS, subsistemas, seguros e privados.",
        source: "OCDE e Observatório Europeu dos Sistemas de Saúde · Perfil de Saúde de Portugal, 2023",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2023",
      },
      {
        value: "6,9",
        text: "prestadores diferentes, em média, num ano, para quem tem seis doenças crónicas. Cuidados mais fragmentados estão associados a mais medicação inadequada e a maior mortalidade.",
        source: "Prior A et al. · BMC Medicine, 2023 · 4,7 milhões de adultos na Dinamarca",
        url: "https://doi.org/10.1186/s12916-023-03021-3",
      },
      {
        value: "7 de 7",
        text: "estudos com o desenho mais rigoroso concluíram que partilhar informação entre prestadores traz benefícios: menos procedimentos duplicados, menos exames de imagem, custos mais baixos e mais segurança.",
        source: "Menachemi N et al. · JAMIA, 2018 · revisão sistemática",
        url: "https://doi.org/10.1093/jamia/ocy035",
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
        value: "29%",
        text: "of health spending in Portugal is paid directly by households — twice the EU average. Care is split between the national health service, subsystems, insurers and private providers.",
        source: "OECD & European Observatory on Health Systems · Portugal Country Health Profile, 2023",
        url: "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2023",
      },
      {
        value: "6.9",
        text: "different providers in a year, on average, for people with six chronic conditions. More fragmented care is associated with more inappropriate medication and higher mortality.",
        source: "Prior A et al. · BMC Medicine, 2023 · 4.7 million adults in Denmark",
        url: "https://doi.org/10.1186/s12916-023-03021-3",
      },
      {
        value: "7 of 7",
        text: "studies with the most rigorous designs found that sharing information between providers brings benefits: fewer duplicated procedures, less imaging, lower costs and better safety.",
        source: "Menachemi N et al. · JAMIA, 2018 · systematic review",
        url: "https://doi.org/10.1093/jamia/ocy035",
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
      </div>
    </section>
  );
}
