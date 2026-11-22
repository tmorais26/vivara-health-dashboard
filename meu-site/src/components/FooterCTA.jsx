import { Link } from "react-router-dom";
import { Reveal, CTAButton } from "./ui";
import { useT } from "../i18n";
import fimPhoto from "../assets/pages/fim.webp";

const T = {
  pt: {
    title: (
      <>
        Pronto para <em>começar?</em>
      </>
    ),
    desc: "Um lugar seguro para exames, resultados e registos médicos — para médicos e utentes.",
    cta: "Começar",
    tagline: "Para que cada consulta médica valha a pena.",
  },
  en: {
    title: (
      <>
        Ready to <em>get started?</em>
      </>
    ),
    desc: "A safe place for exams, results and medical records — for doctors and patients.",
    cta: "Get started",
    tagline: "So that every doctor's appointment counts.",
  },
};

export default function FooterCTA() {
  const t = useT();
  const L = t(T);
  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      <img
        src={fimPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "70% 25%" }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-beige/30 via-brand-beige/65 to-brand-beige/85 md:bg-none md:bg-gradient-to-r md:from-brand-beige md:via-brand-beige/80 md:to-transparent md:to-70%" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="max-w-xl text-center md:text-left">
          <h2 className="font-serif font-light tracking-tight text-5xl md:text-7xl">{L.title}</h2>
          <p className="mt-6 text-lg text-brand-muted">{L.desc}</p>
          <div className="mt-10">
            <Link to="/comecar"><CTAButton>{L.cta}</CTAButton></Link>
          </div>
          <p className="mt-8 font-serif italic text-xl text-brand-muted">{L.tagline}</p>
        </Reveal>
      </div>
    </section>
  );
}
