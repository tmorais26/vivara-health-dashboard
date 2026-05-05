import { useEffect, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

/**
 * Pequeno botão "?" / ícone Info que abre um drawer (bottom-sheet) com
 * uma descrição contextual. Reutilizável tanto na app do utente como
 * no portal do médico.
 */
export function InfoHint({
  title,
  children,
  label,
  className,
  iconClassName,
}: {
  title: string;
  children: ReactNode;
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={label ?? `Saber mais sobre ${title}`}
        className={
          className ??
          "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        <Info className={iconClassName ?? "h-3 w-3"} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/40 backdrop-blur-sm"
          />
          <div className="max-h-[78%] overflow-y-auto rounded-t-3xl border-t border-border bg-surface-raised px-5 pb-7 pt-3 text-left shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-[20px] leading-tight text-foreground">
                {title}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mr-1 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-foreground/85">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
