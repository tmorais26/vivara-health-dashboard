import { createFileRoute } from "@tanstack/react-router";
import { enviarLembretesDeAmanha } from "@/lib/lembretes.server";

// Chamada uma vez por dia pela Vercel (ver vite.config.ts). A Vercel envia
// "Authorization: Bearer <CRON_SECRET>"; sem esse segredo configurado, a rota não faz nada.
export const Route = createFileRoute("/api/lembretes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const segredo = process.env.CRON_SECRET;
        if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
          return new Response("Não autorizado", { status: 401 });
        }
        try {
          const resultado = await enviarLembretesDeAmanha();
          return Response.json(resultado, { status: resultado.estado === "ok" ? 200 : 503 });
        } catch {
          return Response.json({ estado: "erro" }, { status: 500 });
        }
      },
    },
  },
});
