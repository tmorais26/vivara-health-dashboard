import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import ClinicalAlerts from "../components/ClinicalAlerts";
import TimelineMock from "../components/TimelineMock";

const STEPS = [
  {
    n: "01",
    title: "Convida o utente",
    desc: "Setup rápido: envias um convite por email, o utente aceita e o histórico começa a construir-se a partir desse momento — sem importações complexas nem formulários longos.",
  },
  {
    n: "02",
    title: "Acompanha entre consultas",
    desc: "Análises, exames e notas em linha do tempo, com wearables, sono e atividade ao lado dos dados clínicos. Vê a evolução do utente muito antes de ele voltar à consulta.",
  },
  {
    n: "03",
    title: "Chega preparado à consulta",
    desc: "Todo o contexto reunido num só ecrã — alertas de valores fora do alvo, notas da última visita, adesão ao plano. A decisão clínica continua a ser sempre sua.",
  },
];

const AUDIENCE = [
  {
    title: "Médico independente",
    desc: "Trabalha sozinho ou em part-time em várias clínicas? O portal acompanha os seus utentes onde quer que os veja, sem depender do sistema de cada clínica.",
  },
  {
    title: "Clínica com equipa",
    desc: "Vários profissionais, um só histórico. Partilha o utente com nutricionistas, enfermeiros e outros médicos, cada um com o seu nível de acesso.",
  },
  {
    title: "Hospital ou grupo clínico",
    desc: "Integrações HL7/FHIR, SSO e onboarding dedicado para equipas maiores, com o mesmo portal clínico no centro.",
  },
];

const INCLUDED = [
  {
    title: "Histórico cronológico",
    desc: <>Análises, exames e notas organizados por data, com a <Highlight>tendência de cada marcador</Highlight> ao longo do tempo.</>,
  },
  {
    title: "Wearables ao lado da clínica",
    desc: <>Sono, atividade e recuperação visíveis <Highlight>junto dos dados clínicos</Highlight> — não numa app separada.</>,
  },
  {
    title: "Planos e documentos num só sítio",
    desc: <>Planos de cuidado, prescrições, consultas agendadas e documentos, <Highlight>sem andar a procurar em pastas</Highlight>.</>,
  },
  {
    title: "Diário clínico privado",
    desc: <>Notas internas da equipa, visíveis só entre profissionais — <Highlight>nunca partilhadas com o utente</Highlight>.</>,
  },
  {
    title: "Setup por convite",
    desc: <>Convida o utente por email; <Highlight>não há importações manuais</Highlight> nem onboarding complicado.</>,
  },
  {
    title: "App de utente incluída",
    desc: <>Sem custo adicional para os seus utentes — eles têm <Highlight>sempre acesso ao seu próprio histórico</Highlight>.</>,
  },
  {
    title: "Mensagens diretas",
    desc: <>Conversa com o utente sem sair do portal, com <Highlight>histórico permanente da troca</Highlight>.</>,
  },
  {
    title: "Exportação a qualquer momento",
    desc: <>Os dados do utente podem ser <Highlight>exportados sempre que necessário</Highlight>, num formato aberto.</>,
  },
];

export default function Medicos() {
  return (
    <>
      <PageHeader
        badge="Para médicos · Portal clínico"
        title={<>O contexto completo, <em>antes de cada decisão.</em></>}
        desc="Um portal clínico para acompanhar utentes entre consultas. Análises, exames, wearables e notas — organizados cronologicamente."
      />

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal><SectionBadge>Como funciona</SectionBadge></Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <p className="font-serif text-5xl md:text-6xl opacity-20 text-brand-olive mb-4">{s.n}</p>
                <h3 className="font-serif text-2xl mb-3">{s.title}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>Para quem é</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              De uma consulta a um grupo hospitalar.
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {AUDIENCE.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-black/10 bg-brand-beige p-6 h-full">
                  <h3 className="font-serif text-xl mb-2">{a.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <SectionBadge>O portal, por dentro</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              Alertas clínicos, <em>no contexto certo.</em>
            </h2>
            <p className="mt-5 text-lg text-brand-muted/80 leading-relaxed max-w-md">
              A plataforma sinaliza valores fora do alvo funcional definido por si — sempre com a
              tendência ao longo do tempo, nunca só o último número.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ClinicalAlerts />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal className="md:order-2">
            <SectionBadge>Linha do tempo</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              Cada exame, <em>na sua data.</em>
            </h2>
            <p className="mt-5 text-lg text-brand-muted/80 leading-relaxed max-w-md">
              Análises, wearables e consultas em ordem cronológica — nunca só o valor mais recente.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="md:order-1">
            <TimelineMock />
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-brand-dark">
        <div className="mx-auto max-w-6xl px-6 text-white">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90">Incluído</span>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              Tudo o que precisa no portal clínico.
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-6">
            {INCLUDED.map((it, i) => (
              <Reveal key={it.title} delay={i * 0.05}>
                <div className="flex items-start gap-3">
                  <Check className="size-5 mt-0.5 shrink-0 text-brand-lime" />
                  <div>
                    <p className="text-white/90 font-medium">{it.title}</p>
                    <p className="text-sm text-white/50 mt-0.5">{it.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">Pronto para conhecer a Vivara?</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/precos"><CTAButton>Ver planos</CTAButton></Link>
              <Link to="/contacto" className="rounded-full border border-black/15 px-8 py-4 font-medium hover:bg-black/5 transition-colors">
                Agendar demo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
