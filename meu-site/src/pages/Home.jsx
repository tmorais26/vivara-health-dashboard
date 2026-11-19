import Hero from "../components/Hero";
import Overview from "../components/Overview";
import Problem from "../components/Problem";
import { Timeline, Vault, Insights, Sharing } from "../components/Solutions";
import Trust from "../components/Trust";
import Story from "../components/Story";
import TrustSecurity from "../components/TrustSecurity";
import FAQ from "../components/FAQ";
import FooterCTA from "../components/FooterCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Overview />
      <Timeline />
      <Vault />
      <Insights />
      <Sharing />
      <Trust />
      <Story />
      <TrustSecurity />
      <FAQ />
      <FooterCTA />
    </>
  );
}
