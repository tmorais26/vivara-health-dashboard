import { useIdioma, setIdioma } from "@/lib/i18n";

/**
 * Alternador de idioma compacto (PT / EN) para a barra de topo.
 * Sempre visível, em desktop e mobile, ao lado do tema.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const idioma = useIdioma();
  const proximo = idioma === "pt" ? "en" : "pt";
  return (
    <button
      type="button"
      onClick={() => setIdioma(proximo)}
      aria-label={idioma === "pt" ? "Mudar para inglês" : "Switch to Portuguese"}
      title={idioma === "pt" ? "Idioma: Português — mudar para inglês" : "Language: English — switch to Portuguese"}
      className={`inline-flex items-center overflow-hidden rounded-full border border-border text-[10px] font-medium ${className}`}
    >
      <span
        className={`px-1.5 py-0.5 transition-colors ${
          idioma === "pt" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
      >
        PT
      </span>
      <span
        className={`px-1.5 py-0.5 transition-colors ${
          idioma === "en" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
      >
        EN
      </span>
    </button>
  );
}
