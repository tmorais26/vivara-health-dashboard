import { createFileRoute, redirect } from "@tanstack/react-router";

// /registo?codigo=VIV-…&convite=<uuid> → registo do utente na app, com o código
// já preenchido e o convite guardado até a conta estar criada.
export const Route = createFileRoute("/registo")({
  beforeLoad: ({ location }) => {
    const params = new URLSearchParams(location.searchStr);
    params.set("registo", "1");
    throw redirect({ href: `/app-v2?${params.toString()}` });
  },
});
