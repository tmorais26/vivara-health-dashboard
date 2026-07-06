import { useState } from "react";
import { PageHeader, Reveal } from "../components/ui";
import { useT } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Contacto",
      title: <>Vamos <em>conversar.</em></>,
      desc: "Para demos, parcerias ou questões técnicas. Respondemos em 1-2 dias úteis.",
    },
    thanks: "Obrigado! Respondemos em breve.",
    name: "Nome",
    email: "Email",
    iAm: "Sou…",
    roles: ["Médico / Clínica", "Utente", "Imprensa", "Outro"],
    clinicRole: "Médico / Clínica",
    clinicName: "Nome da clínica",
    message: "Mensagem",
    send: "Enviar mensagem",
    whereLabel: "Onde estamos",
    where: "Lisboa, Portugal",
    institution: "Para clientes com plano Instituição: contacte o seu gestor de conta diretamente.",
  },
  en: {
    header: {
      badge: "Contact",
      title: <>Let's <em>talk.</em></>,
      desc: "For demos, partnerships or technical questions. We reply within 1-2 business days.",
    },
    thanks: "Thank you! We'll get back to you shortly.",
    name: "Name",
    email: "Email",
    iAm: "I am…",
    roles: ["Doctor / Clinic", "Patient", "Press", "Other"],
    clinicRole: "Doctor / Clinic",
    clinicName: "Clinic name",
    message: "Message",
    send: "Send message",
    whereLabel: "Where we are",
    where: "Lisbon, Portugal",
    institution: "For clients on the Institution plan: contact your account manager directly.",
  },
};

export default function Contacto() {
  const t = useT();
  const L = t(T);
  const [sent, setSent] = useState(false);
  const [role, setRole] = useState(0);
  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-10">
          <Reveal>
            {sent ? (
              <div className="rounded-3xl bg-brand-dark text-white p-10">
                <p className="font-serif text-2xl">{L.thanks}</p>
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
                  [L.name, "text"],
                  [L.email, "email"],
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
                  <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{L.iAm}</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(Number(e.target.value))}
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {L.roles.map((r, i) => (
                      <option key={r} value={i}>{r}</option>
                    ))}
                  </select>
                </label>
                {role === 0 && (
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{L.clinicName}</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green-dark"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{L.message}</span>
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
                  {L.send}
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-black/10 bg-white p-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1">{L.email}</p>
                <a href="mailto:equipa@vivara.health" className="font-serif text-lg underline">equipa@vivara.health</a>
              </div>
              <hr className="border-black/10" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1">{L.whereLabel}</p>
                <p className="font-serif text-lg">{L.where}</p>
              </div>
              <hr className="border-black/10" />
              <p className="text-sm text-brand-muted/60 leading-relaxed">{L.institution}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
