import Hero from "../components/Hero";
import Overview from "../components/Overview";
import Problem from "../components/Problem";
import PricingTeaser from "../components/PricingTeaser";
import Trust from "../components/Trust";
import FAQ from "../components/FAQ";
import FooterCTA from "../components/FooterCTA";

// Página inicial curta: uma ideia por secção.
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Overview />
      <PricingTeaser />
      <Trust />
      <FAQ limit={5} />
      <FooterCTA />
    </>
  );
}
