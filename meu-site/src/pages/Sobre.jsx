import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Highlight } from "../components/ui";
import sobrePhoto from "../assets/sobre-photo.jpg";

const PILLARS = [
  {
    title: "Médicos no desenho",
    desc: "Cada ecrã validado por clínicos que o usam em consulta — não desenhado numa sala isolada da prática real.",
  },
  {
    title: "Utentes no centro",
    desc: "Co-criada com pessoas que querem entender e acompanhar a sua própria saúde, não só ver números.",
  },
  {
    title: "Tudo integrado",
    desc: "Um único histórico, partilhado só entre o utente e a equipa que ele escolher — nunca fragmentado.",
  },
];

const PROCESS = [
  {
    n: "01",
    title: "Falámos com quem vive o problema",
    desc: "Antes de desenhar um único ecrã, ouvimos médicos a explicar o que perdem entre consultas, e utentes a descrever o que gostariam de ter à mão.",
  },
  {
    n: "02",
    title: "Desenhámos com médicos reais",
    desc: "Cada funcionalidade passou por clínicos em prática ativa, não só por designers a imaginar um fluxo ideal.",
  },
  {
    n: "03",
    title: "Testámos com utentes reais",
    desc: "Antes de lançar, pessoas comuns usaram a app para o seu dia a dia — não só num laboratório de testes.",
  },
];

const NOT = [
  "Não é medicina de longevidade nem wellness.",
  "Não substitui o seu médico nem faz diagnósticos.",
  "Não vende os seus dados — nunca.",
];

export default function Sobre() {
  return (
    <>
      <PageHeader
        badge="Sobre nós"
        title={<>Nascida de uma <em>frustração partilhada.</em></>}
        desc="A Vivara Health não nasceu numa sala de reuniões. Nasceu de um problema que médicos e utentes viviam todos os dias."
      />

      <section className="bg-brand-beige pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="rounded-3xl overflow-hidden aspect-[4/5]">
              <img src={sobrePhoto} alt="" className="w-full h-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="space-y-5 text-lg text-brand-muted/85 leading-relaxed">
              <p>
                Análises perdidas em emails. Exames espalhados por pastas diferentes. Wearables
                que ninguém olha em consulta. E cada visita a <Highlight>começar do zero</Highlight>,
                como se a anterior nunca tivesse acontecido.
              </p>
              <p>
                A informação existia. Só nunca estava junta — nem pertencia verdadeiramente a
                quem mais precisava dela: o médico que decide, e o utente que{" "}
                <Highlight>vive com a decisão</Highlight>.
              </p>
              <p>
                Por isso construímos a Vivara: <Highlight>um lugar seguro</Highlight> onde o
                historial clínico se constrói continuamente, entre consultas, e não só durante os
                15 minutos que dura cada uma.
              </p>
              <p>
                <Highlight className="font-normal" delay={0.1}>
                  Hoje continuamos a construir com as mesmas duas pessoas em mente: o médico que
                  precisa de contexto para decidir bem, e o utente que precisa de ser dono da sua
                  própria história de saúde.
                </Highlight>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <SectionBadge>O que nos move</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5 max-w-2xl">
              Três princípios, <em>desde o início.</em>
            </h2>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <h3 className="font-serif text-2xl mb-2">{p.title}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>Como construímos</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5 max-w-2xl">
              Devagar, com quem vai usar.
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.1}>
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full">
                  <span className="text-sm text-brand-muted/50">{p.n}</span>
                  <h3 className="font-serif text-xl mt-2 mb-3">{p.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <SectionBadge>Para ser claro</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-3xl md:text-4xl mt-5 mb-8">
              O que a Vivara não é.
            </h2>
            <ul className="space-y-3 max-w-md mx-auto text-left">
              {NOT.map((n) => (
                <li key={n} className="text-brand-muted/80">{n}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">Quer saber mais?</h2>
            <p className="mt-4 text-brand-muted/80">
              Fala connosco — respondemos em 1-2 dias úteis.
            </p>
            <Link to="/contacto">
              <CTAButton className="mt-8">Pedir acesso</CTAButton>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
