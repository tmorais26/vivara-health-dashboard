// O nf3 0.3.x (dependência do nitro) traz dentro de si uma cópia própria do
// @vercel/nft, em nf3/dist/node_modules/@vercel/nft, que não exporta
// `nodeFileTrace`. O Node encontra essa cópia antes da do topo e o build
// rebenta com "does not provide an export named 'nodeFileTrace'".
//
// Apagar a cópia embutida faz a resolução cair no @vercel/nft do topo (mesma
// versão, mas um pacote completo). O nf3 0.4 já não embute nada, mas o nitro
// que usamos pede ^0.3.17 — quando o nitro for actualizado, este script deixa
// de ser preciso e não faz nada (a pasta não existe).
import { rmSync, existsSync } from "node:fs";

const dir = "node_modules/nf3/dist/node_modules/@vercel";
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log("fix-nf3: removida a cópia embutida do @vercel/nft");
}
