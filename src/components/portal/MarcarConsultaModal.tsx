import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Field, ModalActions, PrimaryButton, SecondaryButton, SimpleModal, inputClass } from "@/components/portal/SimpleModal";
import { useT } from "@/lib/i18n";
import { e_clinico, useSessao } from "@/lib/sessao";
import { membrosDoEspaco, rotuloMembro, type MembroDb, type UtenteDb } from "@/lib/dados";

const DURACOES = [15, 30, 45, 60, 90];

function amanhaIso() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function MarcarConsultaModal({
  open,
  onClose,
  onMarcada,
  utenteFixo,
}: {
  open: boolean;
  onClose: () => void;
  onMarcada: () => void;
  utenteFixo?: Pick<UtenteDb, "id" | "nome">;
}) {
  const t = useT();
  const tm = t.marcar;
  const { atual } = useSessao();
  const [profissionais, setProfissionais] = useState<MembroDb[]>([]);
  const [utentes, setUtentes] = useState<Pick<UtenteDb, "id" | "nome">[]>([]);
  const [utenteId, setUtenteId] = useState(utenteFixo?.id ?? "");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState(amanhaIso());
  const [hora, setHora] = useState("09:00");
  const [duracao, setDuracao] = useState(30);
  const [tipo, setTipo] = useState<"presencial" | "video">("presencial");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    if (!open || !atual) return;
    void membrosDoEspaco(atual.espaco_id).then((ms) => {
      const ps = ms.filter((m) => m.estado === "ativo" && (m.funcao === "medico" || m.funcao === "profissional"));
      setProfissionais(ps);
      setProfissionalId((cur) => cur || (e_clinico(atual) ? atual.id : ps[0]?.id ?? ""));
    });
    if (!utenteFixo) {
      void supabase
        .from("utentes")
        .select("id, nome")
        .eq("espaco_id", atual.espaco_id)
        .order("nome")
        .then(({ data: us }) => setUtentes(us ?? []));
    }
  }, [open, atual, utenteFixo]);

  async function marcar(e: React.FormEvent) {
    e.preventDefault();
    if (!atual) return;
    setErro(null);
    const uid = utenteFixo?.id ?? utenteId;
    if (!uid || !profissionalId) return setErro(t.conta.erroObrigatorio);
    const inicio = new Date(`${data}T${hora}:00`);
    if (Number.isNaN(inicio.getTime()) || inicio.getTime() < Date.now()) return setErro(tm.passado);
    const fim = new Date(inicio.getTime() + duracao * 60000);

    setAGuardar(true);
    const { data: sobrepostas } = await supabase
      .from("consultas")
      .select("id, inicio, duracao_min")
      .eq("profissional_id", profissionalId)
      .eq("estado", "agendada")
      .gte("inicio", new Date(inicio.getTime() - 8 * 3600000).toISOString())
      .lt("inicio", fim.toISOString());
    const conflito = (sobrepostas ?? []).some(
      (c) => new Date(c.inicio).getTime() + c.duracao_min * 60000 > inicio.getTime(),
    );
    if (conflito) {
      setAGuardar(false);
      return setErro(tm.sobreposicao);
    }
    const { error } = await supabase.from("consultas").insert({
      espaco_id: atual.espaco_id,
      utente_id: uid,
      profissional_id: profissionalId,
      inicio: inicio.toISOString(),
      duracao_min: duracao,
      tipo,
      motivo: motivo.trim() || null,
      criado_por: atual.id,
    });
    setAGuardar(false);
    if (error) return setErro(t.conta.erroGenerico);
    setMotivo("");
    onMarcada();
  }

  return (
    <SimpleModal open={open} onClose={onClose} title={utenteFixo ? `${tm.titulo} · ${utenteFixo.nome}` : tm.titulo} width="md">
      <form onSubmit={marcar} noValidate className="space-y-4">
        {!utenteFixo && (
          <Field label={tm.utente}>
            <select className={inputClass} value={utenteId} onChange={(e) => setUtenteId(e.target.value)}>
              <option value="">{tm.escolherUtente}</option>
              {utentes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={tm.profissional}>
          {profissionais.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tm.semProfissionais}</p>
          ) : (
            <select className={inputClass} value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)}>
              {profissionais.map((m) => (
                <option key={m.id} value={m.id}>
                  {rotuloMembro(m, { medico: t.ficha.medico, administrativo: t.ficha.administrativo })}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={tm.data}>
            <input type="date" className={inputClass} value={data} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label={tm.hora}>
            <input type="time" step={300} className={inputClass} value={hora} onChange={(e) => setHora(e.target.value)} />
          </Field>
          <Field label={tm.duracao}>
            <select className={inputClass} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
              {DURACOES.map((d) => (
                <option key={d} value={d}>
                  {t.ficha.duracao(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tm.tipo}>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as "presencial" | "video")}>
              <option value="presencial">{t.ficha.presencial}</option>
              <option value="video">{t.ficha.video}</option>
            </select>
          </Field>
        </div>
        <Field label={tm.motivo}>
          <input className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} />
        </Field>
        {erro && (
          <p role="alert" className="text-xs text-state-alert">
            {erro}
          </p>
        )}
        <ModalActions>
          <SecondaryButton onClick={onClose}>{tm.cancelar}</SecondaryButton>
          <PrimaryButton type="submit">{aGuardar ? t.conta.aProcessar : tm.marcar}</PrimaryButton>
        </ModalActions>
      </form>
    </SimpleModal>
  );
}
