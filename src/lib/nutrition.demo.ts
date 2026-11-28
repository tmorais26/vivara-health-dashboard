// Orientação de demonstração (conta de demonstração): texto fixo, sem IA, que
// passa nas mesmas verificações que a resposta real (ver test-lib).
import type { GuidanceContent, NutritionLang } from "./nutrition.rules";

export const DEMO_GUIDANCE: Record<NutritionLang, GuidanceContent> = {
  pt: {
    itens: [
      { tipo: "privilegiar", alimento: "Leguminosas (feijão, grão, lentilhas)", marcador: "LDL-C", porque: "A fibra solúvel das leguminosas ajuda a manter o colesterol LDL mais baixo." },
      { tipo: "privilegiar", alimento: "Aveia e cevada ao pequeno-almoço", marcador: "ApoB", porque: "Têm beta-glucanos, uma fibra associada a menos partículas de colesterol no sangue." },
      { tipo: "privilegiar", alimento: "Peixe gordo duas a três vezes por semana", marcador: "PCR-us", porque: "As gorduras do peixe (sardinha, cavala, salmão) estão associadas a menos inflamação." },
      { tipo: "privilegiar", alimento: "Legumes em metade do prato", marcador: "Insulina", porque: "A fibra abranda a absorção dos açúcares e ajuda a estabilizar a glicose ao longo do dia." },
      { tipo: "reduzir", alimento: "Bolos, bolachas e bebidas açucaradas", marcador: "HbA1c", porque: "O açúcar adicionado faz subir a glicose; reduzi-lo ajuda a mantê-la estável ao longo do tempo." },
      { tipo: "reduzir", alimento: "Charcutaria e carnes processadas", marcador: "LDL-C", porque: "Têm gordura saturada e sal, que tendem a fazer subir o colesterol LDL." },
      { tipo: "reduzir", alimento: "Pão branco e arroz refinado (prefira integrais)", marcador: "Colesterol total", porque: "As versões integrais têm mais fibra, que ajuda o perfil do colesterol." },
    ],
    nota: "Esta orientação é geral e não substitui o acompanhamento do seu médico ou nutricionista.",
  },
  en: {
    itens: [
      { tipo: "privilegiar", alimento: "Pulses (beans, chickpeas, lentils)", marcador: "LDL-C", porque: "The soluble fibre in pulses helps keep LDL cholesterol lower." },
      { tipo: "privilegiar", alimento: "Oats and barley at breakfast", marcador: "ApoB", porque: "They contain beta-glucans, a fibre linked to fewer cholesterol particles in the blood." },
      { tipo: "privilegiar", alimento: "Oily fish two to three times a week", marcador: "PCR-us", porque: "The fats in fish (sardines, mackerel, salmon) are linked to less inflammation." },
      { tipo: "privilegiar", alimento: "Vegetables on half your plate", marcador: "Insulina", porque: "Fibre slows the absorption of sugars and helps keep glucose steady through the day." },
      { tipo: "reduzir", alimento: "Cakes, biscuits and sugary drinks", marcador: "HbA1c", porque: "Added sugar raises glucose; cutting back helps keep it steady over time." },
      { tipo: "reduzir", alimento: "Cured and processed meats", marcador: "LDL-C", porque: "They are high in saturated fat and salt, which tend to raise LDL cholesterol." },
      { tipo: "reduzir", alimento: "White bread and refined rice (choose wholegrain)", marcador: "Colesterol total", porque: "Wholegrain versions have more fibre, which helps your cholesterol profile." },
    ],
    nota: "This guidance is general and does not replace follow-up with your doctor or dietitian.",
  },
};
