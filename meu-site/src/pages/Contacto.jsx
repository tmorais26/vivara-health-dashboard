import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Reveal } from "../components/ui";
import { useT } from "../i18n";

// Web3Forms: envia cada mensagem por email. A chave é pública por natureza
// (fica no browser); só permite enviar para o email associado a ela.
const WEB3FORMS_KEY = "032cafa7-f047-4f1b-8f7c-8412f232793f";

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
    sending: "A enviar…",
    error: "Não foi possível enviar. Tente novamente ou escreva-nos para equipa@vivara.health.",
    noHealth: "Por favor, não inclua dados de saúde nesta mensagem.",
    privacy: ["Usamos estes dados apenas para lhe responder. Veja a ", "Política de Privacidade", "."],
    subject: "Novo contacto pelo site Vivara",
    whereLabel: "Onde estamos",
    where: "Lisboa, Portugal",
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
    sending: "Sending…",
    error: "We couldn't send your message. Please try again or write to equipa@vivara.health.",
    noHealth: "Please don't include health information in this message.",
    privacy: ["We only use this information to reply to you. See our ", "Privacy Policy", "."],
    subject: "New contact from the Vivara website",
    whereLabel: "Where we are",
    where: "Lisbon, Portugal",
  },
};

export default function Contacto() {
  const t = useT();
  const L = t(T);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const sent = status === "sent";

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // armadilha para bots
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: L.subject,
          from_name: "Site Vivara",
          replyto: data.email,
          ...data,
          role: L.roles[role],
        }),
      });
      const json = await res.json().catch(() => ({}));
      setStatus(res.ok && json.success ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }
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
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {[
                  [L.name, "text", "name"],
                  [L.email, "email", "email"],
                ].map(([label, type, field]) => (
                  <label key={label} className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{label}</span>
                    <input
                      type={type}
                      name={field}
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
                      name="clinic"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green-dark"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-brand-muted/60 mb-1 block">{L.message}</span>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none resize-none focus:border-brand-green-dark"
                  />
                  <span className="mt-2 block text-xs text-brand-muted/60">{L.noHealth}</span>
                </label>
                {status === "error" && (
                  <p role="alert" className="text-sm text-red-700">{L.error}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="rounded-full bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-60 text-white px-6 py-3 text-sm font-medium transition-colors"
                >
                  {status === "sending" ? L.sending : L.send}
                </button>
                <p className="text-xs text-brand-muted/60">
                  {L.privacy[0]}
                  <Link to="/privacidade" className="underline">{L.privacy[1]}</Link>
                  {L.privacy[2]}
                </p>
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
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
