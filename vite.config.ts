// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Fora do sandbox da Lovable (ex.: build da Vercel a partir do GitHub), o
// plugin nitro fica desligado por omissão e o output deixa de ter o
// roteamento correto para SSR — daqui resultam 404 da Vercel em produção.
// Dentro do sandbox da Lovable este preset é ignorado (força sempre Cloudflare).
export default defineConfig({ nitro: { preset: "vercel" } });
