import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  estadoReferencia,
  foraDoAlvo,
  formatarIntervalo,
  formatarNumero,
  normalizarMarcador,
} from "@/lib/marcadores";
import { soData, type ConsultaDb, type UtenteDb } from "@/lib/dados";
import { useIdioma, useT } from "@/lib/i18n";

type Gravidade = "alerta" | "atencao" | "info";
type Item = {
  id: string;
  gravidade: Gravidade;
  texto: string;
  acao?: { rotulo: string; tab?: string; consultaId?: string; marcar?: boolean };
};

const DIA = 86400000;
const hojeIso = () => new Date().toISOString().slice(0, 10);

export function Pendencias({
  utente,
  consultas,
  sigo,
  lembretesEspaco,
  onIrPara,
  onMarcar,
}: {
  utente: UtenteDb;
  consultas: ConsultaDb[];
  sigo: boolean;
  lembretesEspaco: boolean;
  onIrPara: (tab: string) => void;
  onMarcar: () => void;
}) {
  const tp = useT().pendencias;
  const idioma = useIdioma();
  const [meds, setMeds] = useState<Tables<"medicacoes">[]>([]);
  const [pedidos, setPedidos] = useState<Tables<"pedidos_exame">[]>([]);
  const [analises, setAnalises] = useState<Tables<"analises">[]>([]);
  const [resultados, setResultados] = useState<Tables<"resultados">[]>([]);
  const [alvos, setAlvos] = useState<Tables<"alvos_marcador">[]>([]);

  useEffect(() => {
    if (!sigo) return;
    void (async () => {
      const [m, p, a, r, al] = await Promise.all([
        supabase.from("medicacoes").select("*").eq("utente_id", utente.id).eq("estado", "ativa"),
        supabase
          .from("pedidos_exame")
          .select("*")
          .eq("utente_id", utente.id)
          .eq("estado", "pendente"),
        supabase.from("analises").select("*").eq("utente_id", utente.id).eq("estado", "valida"),
        supabase.from("resultados").select("*").eq("utente_id", utente.id),
        supabase.from("alvos_marcador").select("*").eq("utente_id", utente.id),
      ]);
      setMeds(m.data ?? []);
      setPedidos(p.data ?? []);
      setAnalises(a.data ?? []);
      setResultados(r.data ?? []);
      setAlvos(al.data ?? []);
    })();
  }, [sigo, utente.id]);

  const itens = useMemo<Item[]>(() => {
    const lista: Item[] = [];
    const agora = Date.now();
    const hoje = hojeIso();

    // Consultas que já passaram e continuam "agendadas".
    for (const c of consultas) {
      if (c.estado === "agendada" && new Date(c.inicio).getTime() + c.duracao_min * 60000 < agora) {
        lista.push({
          id: `consulta-${c.id}`,
          gravidade: "atencao",
          texto: tp.consultaPorFechar(soData(c.inicio, idioma)),
          acao: { rotulo: tp.abrir, consultaId: c.id },
        });
      }
    }
    const temFutura = consultas.some(
      (c) => c.estado === "agendada" && new Date(c.inicio).getTime() > agora,
    );
    const teveConsulta = consultas.some((c) => c.estado === "realizada");
    if (teveConsulta && !temFutura) {
      lista.push({
        id: "sem-proxima",
        gravidade: "info",
        texto: tp.semProxima,
        acao: { rotulo: tp.marcar, marcar: true },
      });
    }

    if (sigo) {
      // Medicação ativa com data de fim ultrapassada ou próxima.
      for (const m of meds) {
        if (!m.fim || m.cronica) continue;
        const dias = Math.round((new Date(m.fim).getTime() - new Date(hoje).getTime()) / DIA);
        if (dias < 0) {
          lista.push({
            id: `med-${m.id}`,
            gravidade: "atencao",
            texto: tp.medicacaoTerminou(m.dci, soData(m.fim, idioma)),
            acao: { rotulo: tp.ver, tab: "medicacao" },
          });
        } else if (dias <= 14) {
          lista.push({
            id: `med-${m.id}`,
            gravidade: "info",
            texto: tp.medicacaoTermina(m.dci, soData(m.fim, idioma)),
            acao: { rotulo: tp.ver, tab: "medicacao" },
          });
        }
      }

      // Exames pedidos sem resultado.
      for (const p of pedidos) {
        const atrasado = p.prazo
          ? p.prazo < hoje
          : agora - new Date(p.pedido_em).getTime() > 30 * DIA;
        lista.push({
          id: `pedido-${p.id}`,
          gravidade: atrasado ? "alerta" : "info",
          texto: atrasado
            ? tp.exameAtrasado(p.descricao, soData(p.pedido_em, idioma))
            : tp.exameAguarda(p.descricao, soData(p.pedido_em, idioma)),
          acao: { rotulo: tp.ver, tab: "analises" },
        });
      }

      // Último valor de cada marcador: fora do alvo, fora da referência, ou alvo sem resultado há mais de um ano.
      const dataDe = new Map(analises.map((a) => [a.id, a.data_colheita]));
      const ultimo = new Map<string, Tables<"resultados"> & { data: string }>();
      for (const r of resultados) {
        const data = dataDe.get(r.analise_id);
        if (!data) continue;
        const chave = normalizarMarcador(r.marcador);
        const atual = ultimo.get(chave);
        if (!atual || data > atual.data) ultimo.set(chave, { ...r, data });
      }
      for (const [chave, r] of ultimo) {
        const alvo = alvos.find((a) => normalizarMarcador(a.marcador) === chave);
        const valor =
          r.valor !== null ? `${formatarNumero(r.valor)} ${r.unidade ?? ""}`.trim() : "";
        if (alvo && foraDoAlvo(r.valor, alvo.alvo_min, alvo.alvo_max)) {
          lista.push({
            id: `alvo-${chave}`,
            gravidade: "atencao",
            texto: tp.foraAlvo(r.marcador, valor, formatarIntervalo(alvo.alvo_min, alvo.alvo_max)),
            acao: { rotulo: tp.ver, tab: "analises" },
          });
        } else if (!alvo) {
          const e = estadoReferencia(r.valor, r.ref_min, r.ref_max);
          if (e === "alto" || e === "baixo") {
            lista.push({
              id: `ref-${chave}`,
              gravidade: "info",
              texto: tp.foraRef(r.marcador, valor, e === "alto"),
              acao: { rotulo: tp.ver, tab: "analises" },
            });
          }
        }
        if (alvo && agora - new Date(r.data).getTime() > 365 * DIA) {
          lista.push({
            id: `antigo-${chave}`,
            gravidade: "info",
            texto: tp.semResultadoRecente(r.marcador, soData(r.data, idioma)),
            acao: { rotulo: tp.ver, tab: "analises" },
          });
        }
      }
    }

    if (lembretesEspaco && !utente.email && temFutura) {
      lista.push({ id: "sem-email", gravidade: "info", texto: tp.semEmail });
    }

    const ordem: Record<Gravidade, number> = { alerta: 0, atencao: 1, info: 2 };
    return lista.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
  }, [
    consultas,
    sigo,
    meds,
    pedidos,
    analises,
    resultados,
    alvos,
    lembretesEspaco,
    utente.email,
    tp,
    idioma,
  ]);

  const Icone = { alerta: CircleAlert, atencao: AlertTriangle, info: Info };
  const cor = {
    alerta: "text-state-alert",
    atencao: "text-state-warn",
    info: "text-muted-foreground",
  };

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5 lg:col-span-2">
      <h2 className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        {tp.titulo}
        {itens.length > 0 && ` (${itens.length})`}
      </h2>
      {itens.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-state-ok" />
          {tp.nada}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((i) => {
            const I = Icone[i.gravidade];
            return (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-start gap-2 text-sm text-foreground">
                  <I className={`mt-0.5 h-4 w-4 shrink-0 ${cor[i.gravidade]}`} />
                  {i.texto}
                </span>
                {i.acao &&
                  (i.acao.consultaId ? (
                    <Link
                      to="/consulta/$eventoId"
                      params={{ eventoId: i.acao.consultaId }}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-accent"
                    >
                      {i.acao.rotulo}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (i.acao!.marcar ? onMarcar() : onIrPara(i.acao!.tab!))}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-accent"
                    >
                      {i.acao.rotulo}
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
