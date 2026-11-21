// Marcas "redondas" (1, 2, 2.5, 5 × 10^n) e sem valores negativos quando não fazem sentido.
export function eixoY(min: number, max: number, naoNegativo: boolean) {
  const span = max - min || Math.abs(max) || 1;
  const bruto = span / 4;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= bruto)!;
  let lo = Math.floor((min - span * 0.05) / passo) * passo;
  const hi = Math.ceil((max + span * 0.05) / passo) * passo;
  if (naoNegativo) lo = Math.max(0, lo);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + passo / 2; v += passo) ticks.push(Number(v.toFixed(6)));
  return { dominio: [lo, hi] as [number, number], ticks };
}
