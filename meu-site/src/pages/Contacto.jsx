import { useState } from "react";
import { PageHeader, Reveal } from "../components/ui";

export default function Contacto() {
  const [sent, setSent] = useState(false);
  const [role, setRole] = useState("Médico / Clínica");
  return (
    <>
      <PageHeader
        badge="Contacto"
        title={<>Vamos <em>conversar.</em></>}
        desc="Para demos, parcerias ou questões técnicas. Respondemos em 1-2 dias úteis."
      />
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-10">
          <Reveal>
            {sent ? (
              <div className="rounded-3xl bg-brand-dark text-white p-10">
                <p className="font-serif text-2xl">Obrigado! Respondemos em breve.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-5"
              >
                {[
                  ["Nome", "text"],
                  ["Email", "email"],
                ].map(([label, type]) => (
                  <label key={label} className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{label}</span>
                    <input
                      type={type}
                      required
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green-dark"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">Sou…</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option>Médico / Clínica</option>
                    <option>Utente</option>
                    <option>Imprensa</option>
                    <option>Outro</option>
                  </select>
                </label>
                {role === "Médico / Clínica" && (
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">Nome da clínica</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green-dark"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">Mensagem</span>
                  <textarea
                    rows={5}
                    required
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none resize-none focus:border-brand-green-dark"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-brand-olive hover:bg-brand-olive-hover text-white px-6 py-3 text-sm font-medium transition-colors"
                >
                  Enviar mensagem
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-black/10 bg-white p-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1">Email</p>
                <a href="mailto:equipa@vivara.health" className="font-serif text-lg underline">equipa@vivara.health</a>
              </div>
              <hr className="border-black/10" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1">Onde estamos</p>
                <p className="font-serif text-lg">Lisboa, Portugal</p>
              </div>
              <hr className="border-black/10" />
              <p className="text-sm text-brand-muted/60 leading-relaxed">
                Para clientes com plano Instituição: contacte o seu gestor de conta diretamente.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
