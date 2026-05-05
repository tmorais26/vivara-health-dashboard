import { useEffect, useState } from "react";
import { Clock, Fingerprint, X } from "lucide-react";

/**
 * Aviso visual de sessão a expirar — mock de compliance (RGPD/Art. 9).
 * Mostra uma faixa fina ao topo aos 12 minutos, simulando logout aos 15.
 * Apenas ilustrativo: não há lógica real de sessão.
 */
export function SessionTimeoutBanner() {
  const [visible, setVisible] = useState(false);
  const [secs, setSecs] = useState(180);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 25_000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-state-warn/30 bg-state-warn-soft px-6 py-2 text-[12px] text-state-warn">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        <span>
          A sua sessão expira em{" "}
          <span className="tabular font-medium">
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
          . Pressione qualquer botão para renovar.
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {isMobile && (
          <button
            type="button"
            onClick={() => {
              setSecs(180);
              setVisible(false);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:opacity-90"
            title="Desbloquear com Face ID / impressão digital"
          >
            <Fingerprint className="h-3 w-3" />
            Face ID
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setSecs(180);
            setVisible(false);
          }}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium hover:bg-state-warn/10"
        >
          Renovar agora
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}