import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Empresa",
    links: [
      ["Sobre nós", "/sobre"],
      ["Como funciona", "/como-funciona"],
      ["Preços", "/precos"],
    ],
  },
  {
    title: "Ajuda",
    links: [
      ["Para médicos", "/medicos"],
      ["Para utentes", "/utentes"],
      ["FAQ", "/faq"],
      ["Contacto", "/contacto"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacidade", "/privacidade"],
      ["Termos e condições", "/termos"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-beige px-4 pb-8 pt-4">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white border border-black/10 p-8 md:p-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid place-items-center size-7 rotate-45 rounded-[6px] bg-brand-olive text-white">
                <span className="-rotate-45 text-xs font-semibold">V</span>
              </span>
              <span className="font-serif text-xl">Vivara Health</span>
            </div>
            <p className="text-sm text-brand-muted/70 leading-relaxed max-w-xs">
              A sua saúde, sempre acompanhada.{" "}
              <em className="font-serif">A mesma história, para médicos e utentes.</em>
            </p>
            <div className="mt-5 flex flex-col gap-2 max-w-[220px]">
              <span className="flex items-center gap-2.5 rounded-xl border border-black/10 px-3.5 py-2 text-brand-muted">
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.24-.02-.32-.03-.014-.11-.04-.226-.04-.343 0-1.1.572-2.24 1.192-2.94.744-.85 2.036-1.53 3.107-1.57.014.08.03.15.03.23zm2.457 15.164c-.44.98-.65 1.42-1.22 2.29-.795 1.21-1.917 2.72-3.31 2.73-1.234.014-1.552-.803-3.226-.79-1.674.013-2.024.807-3.26.792-1.393-.014-2.457-1.373-3.253-2.583-2.23-3.397-2.466-7.386-1.088-9.508.978-1.508 2.522-2.39 3.977-2.39 1.48 0 2.41.812 3.634.812 1.187 0 1.912-.813 3.63-.813 1.297 0 2.67.706 3.65 1.926-3.21 1.76-2.69 6.343.466 8.534z" />
                </svg>
                <span className="text-left">
                  <span className="block text-[9px] uppercase tracking-wide text-brand-muted/60">Em breve na</span>
                  <span className="block text-xs font-medium">App Store</span>
                </span>
              </span>
              <span className="flex items-center gap-2.5 rounded-xl border border-black/10 px-3.5 py-2 text-brand-muted">
                <svg viewBox="0 0 512 512" className="size-5 shrink-0">
                  <path fill="#00d4ff" d="M325.3 234.3L104.6 13c-3.2 4.5-5.1 10-5.1 16v454c0 6 1.9 11.4 5.1 16l220.7-221.3z" />
                  <path fill="#00f076" d="M425 214.4L346.5 170 267 249.4l79.5 79.5L425 284.5c14.7-8.5 14.7-29.6 0-38.1z" />
                  <path fill="#ff3a44" d="M104.6 13a24.7 24.7 0 0 0-4.4 2.7l238.3 154.3 61.1-61.1L104.6 13z" />
                  <path fill="#ffcf00" d="M99.5 483c1.1 8 6.1 15.1 14.4 18.3.7.3 1.5.5 2.2.7l223.8-224.6-61.1-61.1L99.5 483z" />
                </svg>
                <span className="text-left">
                  <span className="block text-[9px] uppercase tracking-wide text-brand-muted/60">Em breve no</span>
                  <span className="block text-xs font-medium">Google Play</span>
                </span>
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50 mb-4">{col.title}</p>
              <ul className="space-y-2 text-sm text-brand-muted">
                {col.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="hover:text-brand-text">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-black/10 text-xs text-brand-muted/60">
          © {new Date().getFullYear()} Vivara Health. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
