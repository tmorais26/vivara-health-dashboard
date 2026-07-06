import { useEffect, useState } from "react";
import { useT } from "../i18n";

const T = {
  pt: {
    text: "Usamos cookies essenciais e, com a sua autorização, cookies de análise para melhorar a experiência.",
    accept: "Aceitar",
    refuse: "Recusar",
  },
  en: {
    text: "We use essential cookies and, with your permission, analytics cookies to improve the experience.",
    accept: "Accept",
    refuse: "Decline",
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
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-[60] rounded-2xl bg-white border border-black/10 shadow-xl p-5">
      <p className="text-sm text-brand-muted leading-relaxed mb-4">{L.text}</p>
      <div className="flex gap-2">
        <button
          onClick={() => decide("all")}
          className="rounded-full bg-brand-olive text-white px-4 py-2 text-sm"
        >
          {L.accept}
        </button>
        <button
          onClick={() => decide("essential")}
          className="rounded-full border border-black/15 px-4 py-2 text-sm"
        >
          {L.refuse}
        </button>
      </div>
    </div>
  );
}
