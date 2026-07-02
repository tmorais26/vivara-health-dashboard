import { PageHeader, Reveal } from "../components/ui";

const ITEMS = [
  ["Histórico unificado", "Análises, exames, notas e documentos numa única linha do tempo, pesquisável e exportável."],
  ["Insights claros", "Padrões e evolução mês a mês, sem ruído — o essencial para cada consulta."],
  ["Acompanhamento contínuo", "A saúde acompanhada entre consultas, não só no dia da visita."],
  ["Wearables", "Apple Health, Oura e Whoop. Sono e atividade ao lado dos dados clínicos."],
  ["Documentos seguros", "Cofre encriptado para PDFs, exames e cartas — sempre acessível, sempre privado."],
  ["Mensagens diretas", "Conversa direta e privada entre utente e equipa clínica, com histórico permanente."],
];

export default function Funcionalidades() {
  return (
    <>
      <PageHeader
        badge="Funcionalidades"
        title={<>Tudo o que precisa, <em>nada que distraia.</em></>}
        desc="Cada funcionalidade existe para servir o acompanhamento contínuo — não para encher o ecrã."
      />
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ITEMS.map(([title, desc], i) => (
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
