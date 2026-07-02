import { Link } from "react-router-dom";
import { Reveal, CTAButton } from "./ui";
import gradientWarm from "../assets/gradient-warm.jpg";

export default function FooterCTA() {
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
          <h2 className="font-serif font-light tracking-tight text-5xl md:text-7xl">
            Pronto para acompanhar a sua <em>saúde de perto?</em>
          </h2>
          <p className="mt-6 text-lg text-brand-muted">
            Um lugar seguro para exames, resultados e registos médicos — para médicos e utentes.
          </p>
          <div className="mt-10">
            <Link to="/contacto"><CTAButton>Pedir acesso</CTAButton></Link>
          </div>
          <p className="mt-8 font-serif italic text-xl text-brand-muted">
            Para que cada consulta médica valha a pena.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
