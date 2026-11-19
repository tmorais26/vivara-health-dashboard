import { PageHeader, Reveal } from "../components/ui";
import { useT } from "../i18n";
import { LEGAL } from "../content/legal";

// Destaca o que ainda está por definir ([ … ]) e torna os sites citados clicáveis.
function Rich({ text }) {
  return text.split(/(\[[^\]]+\]|www\.[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)]*)?)/gi).map((part, i) => {
    if (part.startsWith("[")) {
      return (
        <mark key={i} className="rounded bg-black/[0.06] px-1 text-brand-muted">
          {part}
        </mark>
      );
    }
    if (/^www\./i.test(part)) {
      const url = part.replace(/[.,]$/, "");
      return (
        <a key={i} href={`https://${url}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {part}
        </a>
      );
    }
    return part;
  });
}

function Block({ item }) {
  if (typeof item === "string") {
    return <p className="text-brand-muted/80 leading-relaxed"><Rich text={item} /></p>;
  }
  if (item.list) {
    return (
      <ul className="list-disc space-y-2 pl-5 text-brand-muted/80 leading-relaxed marker:text-brand-muted/40">
        {item.list.map((li) => (
          <li key={li}><Rich text={li} /></li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="divide-y divide-black/10 rounded-2xl border border-black/10 bg-white">
      {item.rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
          <dt className="text-sm font-medium text-brand-dark">{k}</dt>
          <dd className="text-sm text-brand-muted/80 leading-relaxed"><Rich text={v} /></dd>
        </div>
      ))}
    </dl>
  );
}

export default function Legal({ kind }) {
  const t = useT();
  const L = t(LEGAL);
  const c = L[kind];
  return (
    <>
      <PageHeader badge={c.badge} title={<>{c.title[0]}<em>{c.title[1]}</em></>} />
      <div className="bg-brand-beige -mt-6 pb-4">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-sm text-brand-muted/60"><Rich text={c.updated} /></p>
        </div>
      </div>
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-3xl bg-brand-dark px-7 py-8 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">{L.summaryTitle}</p>
            <ul className="mt-4 space-y-3">
              {c.summary.map((s) => (
                <li key={s} className="flex gap-3 leading-relaxed text-white/90">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-lime" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={L.toc} className="mt-10">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/60">{L.toc}</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {c.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-brand-muted/80 hover:text-brand-dark hover:underline"
                  >
                    {i + 1}. {s.h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-14 space-y-12">
            {c.sections.map((s, i) => (
              <Reveal key={s.id}>
                <section id={s.id} className="scroll-mt-28">
                  <h2 className="font-serif text-2xl mb-4">
                    <span className="text-brand-muted/40">{i + 1}.</span> {s.h}
                  </h2>
                  <div className="space-y-4">
                    {s.body.map((item, j) => (
                      <Block key={j} item={item} />
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
