// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Na Vercel, as funções de servidor correm em Frankfurt (fra1), na UE, ao lado
// do Supabase (eu-central-1). Os pedidos com dados de saúde, consentimentos e IP
// não devem sair da UE. Só se aplica ao preset "vercel"; os outros ignoram.
// O tipo do defineConfig só declara algumas opções do nitro; as restantes
// (como `vercel`) passam tal e qual para o nitro.
const nitro = { vercel: { functions: { regions: ["fra1"] } } } as unknown as { preset?: string };

export default defineConfig({ nitro });
