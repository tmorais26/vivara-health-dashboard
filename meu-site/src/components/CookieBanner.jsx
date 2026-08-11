import { useEffect, useState } from "react";
import { useT } from "../i18n";

const T = {
  pt: {
    text: "Usamos cookies essenciais e, com a sua autorização, cookies de análise para melhorar a experiência.",
    accept: "Aceitar",
    refuse: "Recusar",
    label: "Consentimento de cookies",
  },
  en: {
    text: "We use essential cookies and, with your permission, analytics cookies to improve the experience.",
    accept: "Accept",
    refuse: "Decline",
    label: "Cookie consent",
  },
};

export default function CookieBanner() {
  const t = useT();
  const L = t(T);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("vivara_cookies")) setShow(true);
  }, []);

  const decide = (v) => {
    localStorage.setItem("vivara_cookies", v);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label={L.label}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-xs leading-relaxed text-brand-muted/80 sm:text-sm">{L.text}</p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("all")}
            className="flex-1 rounded-full bg-brand-olive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-olive-hover sm:flex-none"
          >
            {L.accept}
          </button>
          <button
            onClick={() => decide("essential")}
            className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm transition-colors hover:bg-black/5 sm:flex-none"
          >
            {L.refuse}
          </button>
        </div>
      </div>
    </div>
  );
}
