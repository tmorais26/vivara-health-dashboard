import { Link } from "react-router-dom";
import { Reveal, CTAButton } from "./ui";
import { useT } from "../i18n";
import gradientWarm from "../assets/gradient-warm.jpg";

const T = {
  pt: {
    title: (
      <>
        Pronto para acompanhar a sua <em>saúde de perto?</em>
      </>
    ),
    desc: "Um lugar seguro para exames, resultados e registos médicos — para médicos e utentes.",
    cta: "Pedir acesso",
    tagline: "Para que cada consulta médica valha a pena.",
  },
  en: {
    title: (
      <>
        Ready to follow your <em>health closely?</em>
      </>
    ),
    desc: "A safe place for exams, results and medical records — for doctors and patients.",
    cta: "Request access",
    tagline: "So that every doctor's appointment counts.",
  },
};

export default function FooterCTA() {
  const t = useT();
  const L = t(T);
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <img
        src={gradientWarm}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-brand-beige/40" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="font-serif font-light tracking-tight text-5xl md:text-7xl">{L.title}</h2>
          <p className="mt-6 text-lg text-brand-muted">{L.desc}</p>
          <div className="mt-10">
            <Link to="/contacto"><CTAButton>{L.cta}</CTAButton></Link>
          </div>
          <p className="mt-8 font-serif italic text-xl text-brand-muted">{L.tagline}</p>
        </Reveal>
      </div>
    </section>
  );
}
