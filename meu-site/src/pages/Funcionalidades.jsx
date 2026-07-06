import { PageHeader, Reveal } from "../components/ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "Funcionalidades",
    title: <>Tudo o que precisa, <em>nada que distraia.</em></>,
    desc: "Cada funcionalidade existe para servir o acompanhamento contínuo — não para encher o ecrã.",
    items: [
      ["Histórico unificado", "Análises, exames, notas e documentos numa única linha do tempo, pesquisável e exportável."],
      ["Insights claros", "Padrões e evolução mês a mês, sem ruído — o essencial para cada consulta."],
      ["Acompanhamento contínuo", "A saúde acompanhada entre consultas, não só no dia da visita."],
      ["Wearables", "Apple Health, Oura e Whoop. Sono e atividade ao lado dos dados clínicos."],
      ["Documentos seguros", "Cofre encriptado para PDFs, exames e cartas — sempre acessível, sempre privado."],
      ["Mensagens diretas", "Conversa direta e privada entre utente e equipa clínica, com histórico permanente."],
    ],
  },
  en: {
    badge: "Features",
    title: <>Everything you need, <em>nothing that distracts.</em></>,
    desc: "Every feature exists to serve continuous care — not to fill the screen.",
    items: [
      ["Unified record", "Lab results, exams, notes and documents on a single timeline, searchable and exportable."],
      ["Clear insights", "Patterns and month-by-month trends, without the noise — the essentials for every appointment."],
      ["Continuous care", "Health followed between appointments, not just on the day of the visit."],
      ["Wearables", "Apple Health, Oura and Whoop. Sleep and activity next to the clinical data."],
      ["Secure documents", "An encrypted vault for PDFs, exams and letters — always accessible, always private."],
      ["Direct messaging", "A direct, private conversation between patient and care team, with a permanent record."],
    ],
  },
};

export default function Funcionalidades() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PageHeader badge={L.badge} title={L.title} desc={L.desc} />
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {L.items.map(([title, desc], i) => (
              <Reveal key={title} delay={(i % 3) * 0.08}>
                <div className="rounded-2xl border border-black/10 bg-white p-6 h-full">
                  <h3 className="font-serif text-xl mb-2">{title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
