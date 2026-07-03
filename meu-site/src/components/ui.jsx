import { motion } from "framer-motion";

// Scroll reveal wrapper
export function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionBadge({ children, tone = "light" }) {
  const styles =
    tone === "dark"
      ? "border-white/25 text-white/80"
      : "border-black/10 text-brand-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm ${styles}`}
    >
      {children}
    </span>
  );
}

// Heading that supports an <em> emphasis via the `emphasis` prop
export function SerifHeading({ children, className = "" }) {
  return (
    <h2 className={`font-serif font-light tracking-tight ${className}`}>{children}</h2>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-full bg-brand-olive hover:bg-brand-olive-hover text-white px-6 py-3 text-sm font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function CTAButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-full bg-brand-lime hover:bg-brand-lime-hover text-brand-text px-8 py-4 font-medium transition-all hover:-translate-y-0.5 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-full border border-white/50 text-white px-8 py-3 hover:bg-white/10 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Inner-page header (beige) with badge + serif title + description
export function PageHeader({ badge, title, desc }) {
  return (
    <section className="bg-brand-beige pt-36 md:pt-44 pb-12 md:pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          {badge && <SectionBadge>{badge}</SectionBadge>}
          <h1 className="font-serif font-light tracking-tight text-5xl md:text-7xl mt-5 max-w-3xl">
            {title}
          </h1>
          {desc && <p className="mt-6 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">{desc}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function Check({ className = "size-5 shrink-0 text-brand-green-dark", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Editorial highlight: fades from muted to amber as it enters the viewport
export function Highlight({ children, delay = 0.3, className = "font-medium" }) {
  return (
    <motion.span
      className={className}
      initial={{ color: "var(--color-brand-muted)", opacity: 0.5 }}
      whileInView={{ color: "var(--color-accent-amber)", opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.span>
  );
}

export function TrustBadge({ top, bottom }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-center">
      <p className="text-xs text-brand-muted/60">{top}</p>
      <p className="text-sm font-medium">{bottom}</p>
    </div>
  );
}
