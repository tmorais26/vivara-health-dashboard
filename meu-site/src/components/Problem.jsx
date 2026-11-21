import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

// A história de um ano normal, mês a mês. Cada passo leva por baixo um dado
// oficial, discreto, com fonte. Números confirmados nos originais:
// Perfil de Saúde do País 2025: Portugal (OCDE e Observatório Europeu) e
// Prior A et al., BMC Medicine 2023; Overhage & McCallie, Ann Intern Med 2020;
// Adler-Milstein & Wang, JAMIA 2020.
const CHP = "https://eurohealthobservatory.who.int/publications/m/portugal-country-health-profile-2025";
const PRIOR = "https://doi.org/10.1186/s12916-023-03021-3";
const ANNALS = "https://doi.org/10.7326/M18-3684";
const JAMIA = "https://doi.org/10.1093/jamia/ocaa006";

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
        stat: "85–100%",
        title: "Análises num laboratório",
        text: "O seu médico pede análises. Faz a colheita num laboratório e o resultado chega-lhe por email, em PDF.",
        fact: "Em Portugal, 85–100% das análises e exames de radiologia são feitos por privados — incluindo muitos dos que o SNS pede.",
        source: "OCDE e Observatório Europeu, 2025",
        url: CHP,
      },
      {
        when: "Março",
        stat: "3,7 M",
        title: "Uma consulta pelo seguro",
        text: "Para não esperar, marca um especialista no privado. As análises? Ficaram no email.",
        fact: "Quase 3,7 milhões de pessoas têm seguro de saúde, e o recurso a privados quando se está doente duplicou desde 2013.",
        source: "OCDE e Observatório Europeu, 2025",
        url: CHP,
      },
      {
        when: "Junho",
        stat: "6,9",
        title: "Um exame noutro sítio",
        text: "O especialista pede uma ecografia, feita noutro hospital. Mais um PDF, noutra pasta.",
        fact: "Com seis doenças crónicas, passa-se em média por 6,9 prestadores num ano — e cuidados mais fragmentados estão associados a piores resultados.",
        source: "BMC Medicine, 2023",
        url: PRIOR,
      },
      {
        when: "Setembro",
        stat: "16 min",
        title: "De volta ao seu médico",
        text: "«Trouxe as análises?» A consulta começa à procura do que já foi feito.",
        fact: "Os médicos passam, em média, 16 minutos por consulta no registo clínico — um terço desse tempo a rever o historial.",
        source: "Annals of Internal Medicine, 2020 · 100 milhões de consultas",
        url: ANNALS,
      },
    ],
    closing: "Com a Vivara, cada resultado vai para o mesmo historial — e o seu médico vê o ano inteiro antes de a consulta começar.",
    closingFacts: [
      {
        fact: "Quando os resultados de outros hospitais deixaram de estar num separador à parte e passaram a aparecer junto dos restantes, os médicos passaram a abri-los mais 22 920 vezes por semana.",
        source: "JAMIA, 2020 · Universidade da Califórnia, São Francisco",
        url: JAMIA,
      },
      {
        fact: "40% dos adultos em Portugal já consultam o seu registo de saúde online, acima da média europeia de 28%.",
        source: "OCDE e Observatório Europeu, 2025",
        url: CHP,
      },
    ],
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
        stat: "85–100%",
        title: "Lab tests at a lab",
        text: "Your doctor orders lab tests. You have your blood drawn at a lab and the result arrives by email, as a PDF.",
        fact: "In Portugal, 85–100% of laboratory and radiology tests are performed by private providers — including many ordered by the national health service.",
        source: "OECD & European Observatory, 2025",
        url: CHP,
      },
      {
        when: "March",
        stat: "3.7 M",
        title: "An appointment through insurance",
        text: "To avoid the wait, you book a private specialist. Your lab results? Still in your inbox.",
        fact: "Almost 3.7 million people have private health insurance, and turning to private providers when ill has doubled since 2013.",
        source: "OECD & European Observatory, 2025",
        url: CHP,
      },
      {
        when: "June",
        stat: "6.9",
        title: "A scan somewhere else",
        text: "The specialist orders an ultrasound, done at another hospital. Another PDF, in another folder.",
        fact: "With six chronic conditions, people see 6.9 providers a year on average — and more fragmented care is associated with worse outcomes.",
        source: "BMC Medicine, 2023",
        url: PRIOR,
      },
      {
        when: "September",
        stat: "16 min",
        title: "Back to your doctor",
        text: "\"Did you bring your results?\" The appointment starts by searching for what has already been done.",
        fact: "Doctors spend an average of 16 minutes per appointment in the health record — a third of it reviewing the patient's history.",
        source: "Annals of Internal Medicine, 2020 · 100 million appointments",
        url: ANNALS,
      },
    ],
    closing: "With Vivara, every result goes into the same record — and your doctor sees the whole year before the appointment begins.",
    closingFacts: [
      {
        fact: "When results from other hospitals stopped sitting in a separate tab and appeared alongside the rest, doctors opened them 22,920 more times a week.",
        source: "JAMIA, 2020 · University of California, San Francisco",
        url: JAMIA,
      },
      {
        fact: "40% of adults in Portugal already access their health record online, above the EU average of 28%.",
        source: "OECD & European Observatory, 2025",
        url: CHP,
      },
    ],
  },
};

const CARD_BG = ["bg-brand-beige", "bg-[#eef2e6]", "bg-[#e2eadb]"];

function Source({ fact, source, url, dark }) {
  return (
    <p className={`mt-4 text-sm leading-relaxed ${dark ? "text-white/70" : "text-brand-muted/75"}`}>
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

        {/* Cartões que se empilham ao fazer scroll (em ecrãs largos) */}
        <ol className="mt-16 space-y-6 md:space-y-10">
          {L.steps.map((st, i) => {
            const dark = i === L.steps.length - 1;
            return (
              <li key={st.when} className="md:sticky" style={{ top: `${6 + i * 1.25}rem` }}>
                <div
                  className={`grid gap-8 rounded-3xl border p-8 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-12 ${
                    dark ? "border-brand-dark bg-brand-dark text-white" : `border-black/5 ${CARD_BG[i]}`
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-[0.18em] ${dark ? "text-white/60" : "text-brand-muted/60"}`}>
                      {String(i + 1).padStart(2, "0")} · {st.when}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl leading-tight md:text-5xl">{st.title}</h3>
                    <p className={`mt-4 max-w-md text-lg leading-relaxed ${dark ? "text-white/85" : "text-brand-muted/85"}`}>{st.text}</p>
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className={`font-serif text-6xl leading-none md:text-7xl ${dark ? "text-brand-lime" : "text-brand-green-dark"}`}>{st.stat}</p>
                    {st.fact && <Source fact={st.fact} source={st.source} url={st.url} dark={dark} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <Reveal delay={0.1}>
          <div className="mt-16 rounded-3xl bg-brand-dark px-8 py-10 text-white md:px-12">
            <p className="font-serif text-2xl md:text-3xl leading-snug max-w-3xl">{L.closing}</p>
            {L.closingFacts.map((f) => (
              <Source key={f.source} fact={f.fact} source={f.source} url={f.url} dark />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
