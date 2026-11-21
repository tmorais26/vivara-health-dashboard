// Endereços de registo. Quando existirem, basta preenchê-los aqui:
//  - utente: página da app (App Store / Google Play) ou registo web
//  - medico: página de criação de conta do portal
// Enquanto estiverem vazios, os botões levam ao formulário de contacto com
// o perfil já escolhido (lista de espera).
export const ACCESS_URLS = {
  utente: "",
  medico: "",
};

// Preços em vigor (IVA incluído). Mantêm-se aqui para o resumo da página inicial.
export const PRICES = {
  utente: { monthly: "6,99", annual: "79" },
  medico: { monthly: "29,99", annual: "320" },
};

// Preço por dia a partir do preço mensal em texto ("29,99" → "1"; "6,99" → "0,23").
export function dayPrice(monthly) {
  const v = Math.round((parseFloat(monthly.replace(",", ".")) / 30) * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
}
