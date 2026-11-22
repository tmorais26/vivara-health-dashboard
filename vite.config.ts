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
// A tarefa diária envia os lembretes das consultas de amanhã (17h UTC = 17h/18h em Lisboa).
export default defineConfig({
  nitro: {
    preset: "vercel",
    // A configuração da Lovable passa estas opções ao Nitro tal como estão; só a tipagem é mais curta.
    ...({
      vercel: {
        config: { version: 3, crons: [{ path: "/api/lembretes", schedule: "0 17 * * *" }] },
      },
    } as object),
  },
});
