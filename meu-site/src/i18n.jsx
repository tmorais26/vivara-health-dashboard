import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "vivara_lang";

const LanguageContext = createContext({ lang: "pt", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "pt" || saved === "en") return saved;
    return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.title =
      lang === "pt"
        ? "Vivara Health — A sua saúde, sempre acompanhada"
        : "Vivara Health — Your health, always looked after";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Devolve o conteúdo do idioma ativo a partir de um dict { pt, en }
export function useT() {
  const { lang } = useLang();
  return (obj) => obj[lang];
}
