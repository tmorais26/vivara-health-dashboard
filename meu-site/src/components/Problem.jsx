import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

// A história de um ano normal, mês a mês. Cada passo leva por baixo um dado
// oficial, discreto, com fonte. Números confirmados nos originais:
// Perfil de Saúde do País 2025: Portugal (OCDE e Observatório Europeu) e
// Prior A et al., BMC Medicine 2023.
const CHP = "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025";
const PRIOR = "https://doi.org/10.1186/s12916-023-03021-3";

const T = {
  pt: {
    badge: "O problema",
    title: (
      <>
        Os resultados existem. <em>Só não chegam ao mesmo sítio.</em>
      </>
    ),
    desc: "Um ano normal de cuidados de saúde passa por vários sítios. Os resultados vão ficando pelo caminho.",
    steps: [
      {
        when: "Janeiro",
        title: "Análises num laboratório",
        text: "O seu médico pede análises. Faz a colheita num laboratório e o resultado chega-lhe por email, em PDF.",
        fact: "Em Portugal, 85–100% das análises e exames de radiologia são feitos por privados — incluindo muitos dos que o SNS pede.",
        source: "OCDE e Observatório Europeu, 2025",
        url: CHP,
      },
      {
        when: "Março",
        title: "Uma consulta pelo seguro",
        text: "Para não esperar, marca um especialista no privado. As análises? Ficaram no email.",
        fact: "Quase 3,7 milhões de pessoas têm seguro de saúde, e o recurso a privados quando se está doente duplicou desde 2013.",
        source: "OCDE e Observatório Europeu, 2025",
        url: CHP,
      },
      {
        when: "Junho",
        title: "Um exame noutro sítio",
        text: "O especialista pede uma ecografia, feita noutro hospital. Mais um PDF, noutra pasta.",
        fact: "Com seis doenças crónicas, passa-se em média por 6,9 prestadores num ano — e cuidados mais fragmentados estão associados a piores resultados.",
        source: "BMC Medicine, 2023",
        url: PRIOR,
      },
      {
        when: "Setembro",
        title: "De volta ao seu médico",
        text: "«Trouxe as análises?» A consulta começa à procura do que já foi feito.",
      },
    ],
    closing: "Com a Vivara, cada resultado vai para o mesmo historial — e o seu médico vê o ano inteiro antes de a consulta começar.",
    closingFact: "40% dos adultos em Portugal já consultam o seu registo de saúde online, acima da média europeia de 28%.",
    closingSource: "OCDE e Observatório Europeu, 2025",
  },
  en: {
    badge: "The problem",
    title: (
      <>
        The results exist. <em>They just don't end up in one place.</em>
      </>
    ),
    desc: "An ordinary year of healthcare passes through several places. Results get left behind along the way.",
    steps: [
      {
        when: "January",
        title: "Lab tests at a lab",
        text: "Your doctor orders lab tests. You have your blood drawn at a lab and the result arrives by email, as a PDF.",
        fact: "In Portugal, 85–100% of laboratory and radiology tests are performed by private providers — including many ordered by the national health service.",
        source: "OECD & European Observatory, 2025",
        url: CHP,
      },
      {
        when: "March",
        title: "An appointment through insurance",
        text: "To avoid the wait, you book a private specialist. Your lab results? Still in your inbox.",
        fact: "Almost 3.7 million people have private health insurance, and turning to private providers when ill has doubled since 2013.",
        source: "OECD & European Observatory, 2025",
        url: CHP,
      },
      {
        when: "June",
        title: "A scan somewhere else",
        text: "The specialist orders an ultrasound, done at another hospital. Another PDF, in another folder.",
        fact: "With six chronic conditions, people see 6.9 providers a year on average — and more fragmented care is associated with worse outcomes.",
        source: "BMC Medicine, 2023",
        url: PRIOR,
      },
      {
        when: "September",
        title: "Back to your doctor",
        text: "\"Did you bring your results?\" The appointment starts by searching for what has already been done.",
      },
    ],
    closing: "With Vivara, every result goes into the same record — and your doctor sees the whole year before the appointment begins.",
    closingFact: "40% of adults in Portugal already access their health record online, above the EU average of 28%.",
    closingSource: "OECD & European Observatory, 2025",
  },
};

function Source({ fact, source, url, dark }) {
  return (
    <p className={`mt-4 text-xs leading-relaxed ${dark ? "text-white/45" : "text-brand-muted/55"}`}>
      {fact}{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${dark ? "hover:text-white/80" : "hover:text-brand-muted/90"}`}
      >
        {source}
      </a>
    </p>
  );
}

export default function Problem() {
  const t = useT();
  const L = t(T);
  return (
    <section id="porque" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">
            {L.title}
          </h2>
          <p className="mt-5 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">{L.desc}</p>
        </Reveal>

        {/* Linha do tempo: vertical em mobile, horizontal a partir de lg */}
        <ol className="mt-16 grid gap-10 lg:grid-cols-4 lg:gap-8">
          {L.steps.map((s, i) => (
            <Reveal key={s.when} delay={i * 0.1}>
              <li className="relative h-full border-l-2 border-black/10 pl-6 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6">
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-1 size-3 rounded-full bg-brand-lime lg:-top-[7px] lg:left-0"
                />
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-muted/60">{s.when}</p>
                <h3 className="font-serif text-2xl mt-2 mb-2">{s.title}</h3>
                <p className="text-brand-muted/85 leading-relaxed">{s.text}</p>
                {s.fact && <Source fact={s.fact} source={s.source} url={s.url} />}
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.1}>
          <div className="mt-16 rounded-3xl bg-brand-dark px-8 py-10 text-white md:px-12">
            <p className="font-serif text-2xl md:text-3xl leading-snug max-w-3xl">{L.closing}</p>
            <Source fact={L.closingFact} source={L.closingSource} url={CHP} dark />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
