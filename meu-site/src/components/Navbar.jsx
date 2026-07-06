import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, useT } from "../i18n";

const LINKS = {
  pt: [
    { label: "Sobre nós", to: "/sobre" },
    { label: "Como funciona", to: "/como-funciona" },
    { label: "Para médicos", to: "/medicos" },
    { label: "Para utentes", to: "/utentes" },
    { label: "Preços", to: "/precos" },
    { label: "FAQ", to: "/faq" },
  ],
  en: [
    { label: "About us", to: "/sobre" },
    { label: "How it works", to: "/como-funciona" },
    { label: "For doctors", to: "/medicos" },
    { label: "For patients", to: "/utentes" },
    { label: "Pricing", to: "/precos" },
    { label: "FAQ", to: "/faq" },
  ],
};

const T = {
  pt: { cta: "Pedir acesso", openMenu: "Abrir menu", closeMenu: "Fechar menu" },
  en: { cta: "Request access", openMenu: "Open menu", closeMenu: "Close menu" },
};

function LangToggle({ className = "" }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex items-center rounded-full border border-black/10 p-0.5 text-xs font-medium ${className}`}>
      {["pt", "en"].map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            lang === l ? "bg-brand-dark text-white" : "text-brand-muted hover:text-brand-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const t = useT();
  const links = t(LINKS);
  const labels = t(T);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4">
      <nav
        className={`mx-auto max-w-6xl flex items-center justify-between gap-4 rounded-full pl-6 pr-2 py-2 transition-all duration-300 ${
          scrolled || open
            ? "bg-white/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)] backdrop-blur-sm"
            : "bg-white/70 backdrop-blur-sm"
        }`}
      >
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center size-7 rotate-45 rounded-[6px] bg-brand-olive text-white">
            <span className="-rotate-45 text-xs font-semibold">V</span>
          </span>
          <span className="font-serif text-xl">Vivara Health</span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm text-brand-muted">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-brand-text transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <LangToggle />
          <Link
            to="/contacto"
            className="inline-flex rounded-full bg-brand-olive hover:bg-brand-olive-hover text-white px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {labels.cta}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? labels.closeMenu : labels.openMenu}
          className="lg:hidden grid place-items-center size-10 rounded-full text-brand-text"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mx-auto max-w-6xl mt-2 rounded-3xl bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)] p-4"
          >
            <div className="flex flex-col gap-1 text-brand-muted">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-xl px-3 py-3 text-base hover:bg-brand-beige hover:text-brand-text transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <LangToggle />
            </div>
            <Link
              to="/contacto"
              className="mt-3 flex items-center justify-center rounded-full bg-brand-olive text-white px-5 py-3 text-sm font-medium"
            >
              {labels.cta}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
