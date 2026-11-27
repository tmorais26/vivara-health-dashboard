// Lista inicial de condições para o utente registar. É um ponto de partida,
// não um vocabulário clínico codificado: "Outra" aceita texto livre, e a lista
// cresce sem mudar o desenho. Quem escolhe é sempre o utente — a app não
// sugere condições a partir dos valores das análises.

export const CONDITION_LIST: [pt: string, en: string][] = [
  // Cardiovascular e metabólico
  ["Hipertensão arterial", "High blood pressure"],
  ["Hipotensão", "Low blood pressure"],
  ["Diabetes tipo 1", "Type 1 diabetes"],
  ["Diabetes tipo 2", "Type 2 diabetes"],
  ["Pré-diabetes", "Prediabetes"],
  ["Colesterol elevado (dislipidemia)", "High cholesterol (dyslipidaemia)"],
  ["Triglicéridos elevados", "High triglycerides"],
  ["Obesidade", "Obesity"],
  ["Excesso de peso", "Overweight"],
  ["Síndrome metabólico", "Metabolic syndrome"],
  ["Esteatose hepática (fígado gordo)", "Fatty liver disease"],
  ["Gota", "Gout"],
  ["Insuficiência cardíaca", "Heart failure"],
  ["Fibrilhação auricular", "Atrial fibrillation"],
  ["Arritmia", "Arrhythmia"],
  ["Doença coronária", "Coronary artery disease"],
  ["Enfarte do miocárdio (antecedente)", "Heart attack (history)"],
  ["AVC (antecedente)", "Stroke (history)"],
  ["Trombose venosa", "Venous thrombosis"],
  ["Varizes", "Varicose veins"],
  // Endócrino e hormonal
  ["Hipotiroidismo", "Hypothyroidism"],
  ["Hipertiroidismo", "Hyperthyroidism"],
  ["Tiroidite de Hashimoto", "Hashimoto's thyroiditis"],
  ["Doença de Graves", "Graves' disease"],
  ["Síndrome do ovário poliquístico", "Polycystic ovary syndrome"],
  ["Endometriose", "Endometriosis"],
  ["Perimenopausa", "Perimenopause"],
  ["Menopausa", "Menopause"],
  ["Osteoporose", "Osteoporosis"],
  ["Osteopenia", "Osteopenia"],
  ["Hipogonadismo", "Hypogonadism"],
  ["Défice de vitamina D", "Vitamin D deficiency"],
  ["Défice de vitamina B12", "Vitamin B12 deficiency"],
  ["Anemia", "Anaemia"],
  ["Anemia por falta de ferro", "Iron-deficiency anaemia"],
  ["Hemocromatose", "Haemochromatosis"],
  ["Talassemia", "Thalassaemia"],
  ["Trombofilia", "Thrombophilia"],
  // Respiratório e alergias
  ["Asma", "Asthma"],
  ["DPOC", "COPD"],
  ["Rinite alérgica", "Allergic rhinitis"],
  ["Sinusite crónica", "Chronic sinusitis"],
  ["Apneia do sono", "Sleep apnoea"],
  ["Alergia alimentar", "Food allergy"],
  ["Alergia a medicamentos", "Drug allergy"],
  ["Alergia ao pólen", "Pollen allergy"],
  ["Urticária", "Urticaria"],
  ["Covid longa", "Long Covid"],
  // Digestivo
  ["Refluxo gastroesofágico", "Acid reflux (GERD)"],
  ["Síndrome do intestino irritável", "Irritable bowel syndrome"],
  ["Doença de Crohn", "Crohn's disease"],
  ["Colite ulcerosa", "Ulcerative colitis"],
  ["Doença celíaca", "Coeliac disease"],
  ["Sensibilidade ao glúten", "Gluten sensitivity"],
  ["Intolerância à lactose", "Lactose intolerance"],
  ["Gastrite", "Gastritis"],
  ["Úlcera gástrica", "Stomach ulcer"],
  ["Obstipação crónica", "Chronic constipation"],
  ["Hérnia do hiato", "Hiatal hernia"],
  ["Pedras na vesícula", "Gallstones"],
  ["Hepatite B", "Hepatitis B"],
  ["Hepatite C", "Hepatitis C"],
  // Neurológico e saúde mental
  ["Enxaqueca", "Migraine"],
  ["Epilepsia", "Epilepsy"],
  ["Doença de Parkinson", "Parkinson's disease"],
  ["Esclerose múltipla", "Multiple sclerosis"],
  ["Insónia", "Insomnia"],
  ["Ansiedade", "Anxiety"],
  ["Depressão", "Depression"],
  ["Perturbação bipolar", "Bipolar disorder"],
  ["PHDA (hiperatividade e défice de atenção)", "ADHD"],
  ["Perturbação do espectro do autismo", "Autism spectrum"],
  ["Perturbação de stress pós-traumático", "Post-traumatic stress disorder"],
  ["Burnout", "Burnout"],
  ["Demência", "Dementia"],
  ["Neuropatia periférica", "Peripheral neuropathy"],
  ["Síndrome do túnel cárpico", "Carpal tunnel syndrome"],
  ["Vertigem", "Vertigo"],
  // Músculo-esquelético e reumatologia
  ["Artrose", "Osteoarthritis"],
  ["Artrite reumatoide", "Rheumatoid arthritis"],
  ["Artrite psoriática", "Psoriatic arthritis"],
  ["Espondilite anquilosante", "Ankylosing spondylitis"],
  ["Fibromialgia", "Fibromyalgia"],
  ["Síndrome de fadiga crónica", "Chronic fatigue syndrome"],
  ["Lúpus", "Lupus"],
  ["Lombalgia crónica", "Chronic low back pain"],
  ["Hérnia discal", "Herniated disc"],
  ["Escoliose", "Scoliosis"],
  ["Tendinite crónica", "Chronic tendinitis"],
  // Pele
  ["Eczema (dermatite atópica)", "Eczema (atopic dermatitis)"],
  ["Psoríase", "Psoriasis"],
  ["Acne", "Acne"],
  ["Rosácea", "Rosacea"],
  ["Dermatite seborreica", "Seborrhoeic dermatitis"],
  ["Hidradenite supurativa", "Hidradenitis suppurativa"],
  ["Vitiligo", "Vitiligo"],
  ["Alopecia areata", "Alopecia areata"],
  // Rim e urinário
  ["Doença renal crónica", "Chronic kidney disease"],
  ["Pedras nos rins", "Kidney stones"],
  ["Infeções urinárias recorrentes", "Recurrent urinary infections"],
  ["Hiperplasia benigna da próstata", "Benign prostatic hyperplasia"],
  ["Incontinência urinária", "Urinary incontinence"],
  // Olhos e ouvidos
  ["Miopia", "Myopia"],
  ["Glaucoma", "Glaucoma"],
  ["Cataratas", "Cataracts"],
  ["Degenerescência macular", "Macular degeneration"],
  ["Olho seco", "Dry eye"],
  ["Perda de audição", "Hearing loss"],
  ["Acufenos (zumbido)", "Tinnitus"],
  // Outros
  ["Cancro (antecedente)", "Cancer (history)"],
  ["Doença autoimune", "Autoimmune disease"],
  ["VIH", "HIV"],
];

const strip = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export interface ConditionMatch { pt: string; en: string }

// Pesquisa sem acentos nos dois idiomas. Os que começam pelo termo vêm antes
// dos que apenas o contêm.
export function searchConditions(query: string, limit = 8): ConditionMatch[] {
  const q = strip(query);
  if (!q) return [];
  const starts: ConditionMatch[] = [];
  const contains: ConditionMatch[] = [];
  for (const [pt, en] of CONDITION_LIST) {
    const a = strip(pt), b = strip(en);
    const hit = (s: string) => s.startsWith(q) || s.split(/[\s(]+/).some((w) => w.startsWith(q));
    if (hit(a) || hit(b)) starts.push({ pt, en });
    else if (a.includes(q) || b.includes(q)) contains.push({ pt, en });
  }
  return [...starts, ...contains].slice(0, limit);
}
