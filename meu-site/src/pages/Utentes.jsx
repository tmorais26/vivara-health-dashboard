import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import AppMock from "../components/AppMock";

const CARDS = [
  { title: "Resumo e histórico unificado", desc: "Todos os seus exames, resultados e consultas num só lugar, organizados por data." },
  {
    title: "Wearables",
    desc: <>Ligue Apple Health, Oura ou Whoop. Sono e atividade <Highlight>ao lado do seu historial clínico</Highlight>, sem trocar de aplicação.</>,
  },
  { title: "Plano diário e mensagens", desc: "Plano diário, mensagens com a equipa clínica e lembretes de consultas." },
];

const PLAN = [
  "Resumo da saúde e histórico unificado",
  "Plano diário, mensagens com a equipa e consultas",
  "Carregar análises e ligar wearables",
  "Lembretes e resumos de cada consulta",
  <Highlight key="export">Os seus dados, sempre seus — exportação completa</Highlight>,
];

export default function Utentes() {
  return (
    <>
      <PageHeader
        badge="Para utentes · App do utente"
        title={<>A sua saúde, <em>na palma da mão.</em></>}
        desc="Um lugar seguro para exames, resultados, sintomas e registos médicos. Sem ruído — só o que importa, perto da sua equipa clínica."
      />

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5 md:order-2">
            {CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-black/10 bg-white p-6">
                  <h3 className="font-serif text-xl mb-2">{c.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15} className="md:order-1">
            <AppMock />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <SectionBadge>Plano de utente</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              €14,99 <span className="text-2xl text-brand-muted/60">/mês</span>
            </h2>
            <p className="mt-4 text-brand-muted/80 leading-relaxed">
              Acesso total à app. Funciona com qualquer médico na Vivara. Cancela quando quiser.
              IVA incluído.
            </p>
            <p className="mt-3 text-sm text-brand-muted/70 leading-relaxed">
              O seu médico ainda não usa a Vivara? Pode começar sozinho — o seu historial fica
              pronto para partilhar assim que ele se juntar.
            </p>
            <Link to="/precos"><CTAButton className="mt-8">Ver planos</CTAButton></Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-brand-dark text-white p-8">
              <h3 className="font-serif text-2xl mb-5">O que está incluído</h3>
              <ul className="space-y-3 text-sm">
                {PLAN.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="size-4 mt-0.5 shrink-0 text-brand-lime" />
                    <span className="text-white/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">Os seus dados, sempre seus.</h2>
            <p className="mt-6 text-lg text-brand-muted/80 leading-relaxed">
              Pode exportar tudo a qualquer momento. Os seus dados só são vistos por si e pela
              equipa clínica que escolheu — nunca por mais ninguém.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
