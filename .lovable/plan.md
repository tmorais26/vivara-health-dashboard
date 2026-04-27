# Vivara Health — Ecrã 5: Dashboard de Utente (Portal da Médica)

Foco: construir só este ecrã, com qualidade alta de produto. Mock realista em pt-PT, todas as categorias de marcadores, estética "Levels/Whoop" — clínico quente.

---

## O que vais ver

Um portal web (desktop-first, responsivo) com a vista longitudinal de um utente. A página combina três zonas: um header de identidade clínica, uma lista densa de marcadores com tendência, e um painel detalhado para o marcador seleccionado.

```text
┌────────────────────────────────────────────────────────────────────┐
│  ← Utentes   Vivara Health                       Dra. Sofia ▾      │
├────────────────────────────────────────────────────────────────────┤
│  ⬤  Maria Antunes, 47  •  Lisboa  •  Última consulta: 12 Mar 2026  │
│      Plano: Longevidade Premium                                    │
│      ⚠ 3 alertas activos   • LDL acima do alvo                     │
│                            • Vitamina D em queda                   │
│                            • HRV abaixo da linha de base           │
├────────────────────────────────────────────────────────────────────┤
│  Análises  Composição  Wearable  Genómica  Prescrições             │
├──────────────────────────────┬─────────────────────────────────────┤
│  MARCADORES (lista)          │  DETALHE: LDL-Colesterol            │
│                              │                                     │
│  • LDL-C       142  ▲  ⚠    │   ┌────────────────────────────┐   │
│  • HDL-C        58  ▬  ●    │   │     gráfico longitudinal    │   │
│  • HbA1c       5.4  ▼  ●    │   │   18 meses · alvo funcional │   │
│  • Ferritina    98  ▬  ●    │   │   linhas de referência      │   │
│  • Vit D        24  ▼  ⚠    │   └────────────────────────────┘   │
│  • TSH         2.1  ▬  ●    │   Valor actual · Δ vs anterior      │
│  • hsCRP       2.8  ▲  ⚠    │   Alvo funcional · Intervalo lab    │
│  • HRV          42  ▼  ⚠    │   Notas da médica · Próxima recolha │
│  • Sono       6h12  ▼  ●    │                                     │
│  • Peso       68.4  ▬  ●    │                                     │
│  …                           │                                     │
└──────────────────────────────┴─────────────────────────────────────┘
```

---

## Estrutura do ecrã

**Header de utente**
- Avatar + nome + idade + cidade
- Última consulta, plano contratado, médica responsável
- Banda de alertas activos (chips clicáveis que saltam para o marcador correspondente)
- Acções rápidas: Nova nota · Configurar alertas · Exportar

**Tabs de categoria**
- Análises · Composição corporal · Wearable · Genómica · Prescrições
- Cada tab filtra a lista de marcadores à esquerda. O painel de detalhe mantém-se.

**Lista de marcadores (coluna esquerda, scrollável)**
Cada linha mostra:
- Nome do marcador + unidade
- Valor mais recente, grande
- Sparkline de tendência (12–18 meses)
- Seta de direcção (▲ ▬ ▼) com semântica clínica (subir nem sempre é mau)
- Tag de estado: **ok** (verde), **atenção** (âmbar), **fora do alvo** (vermelho)
- Data da última recolha em texto pequeno
- Linha seleccionada fica destacada e sincroniza com o painel direito

Densidade alta mas com respiração — divisores subtis, tipografia tabular para os números.

**Painel de detalhe (coluna direita)**
- Título do marcador + categoria + unidade
- Gráfico de linha temporal (18 meses por defeito; toggles 3M / 6M / 1A / Tudo)
- Duas faixas horizontais sobrepostas: **intervalo laboratorial** (cinza claro) e **alvo funcional definido pela médica** (banda âmbar/verde subtil)
- Pontos clicáveis com tooltip (valor, data, fonte: análise / wearable / balança)
- Cartões abaixo do gráfico:
  - Valor actual + Δ vs medição anterior + Δ vs há 12 meses
  - Alvo funcional vs intervalo laboratorial (lado a lado)
  - Notas da médica para este marcador (texto livre, editável inline)
  - Próxima recolha sugerida + botão "Adicionar lembrete"

**Estados clínicos (cores)**
- ok → verde sálvia
- atenção → âmbar quente
- fora do alvo → coral / vermelho terroso (não vermelho hospitalar)
- Aplicados em tags, sparklines, banda do alvo no gráfico, e chips de alerta

---

## Dados mock (pt-PT, realistas)

Utente único: **Maria Antunes, 47 anos, Lisboa**, plano Longevidade Premium, 18 meses de histórico (~6 colheitas de análises, dados diários de wearable, ~weekly de balança).

Marcadores incluídos:
- **Análises**: LDL-C, HDL-C, Triglicéridos, HbA1c, Glicose jejum, Ferritina, Vitamina D, B12, TSH, hsCRP, Homocisteína, Testosterona total
- **Composição corporal**: Peso, IMC, % gordura, massa magra, % água, idade metabólica
- **Wearable**: Sono total, qualidade de sono, HRV, FC repouso, SpO2, passos, temperatura cutânea
- **Genómica**: variantes-chave APOE, MTHFR, FTO (lista resumida, sem gráfico)
- **Prescrições**: lista de medicamentos, manipulados e suplementos activos

Cada marcador tem alvo funcional definido pela médica (diferente do intervalo laboratorial), o que justifica visualmente os alertas.

---

## Direcção estética (Levels/Whoop — clínico quente)

- Fundo off-white quente (não branco puro)
- Tipografia: sans-serif moderna com personalidade suave para títulos, mono tabular para números
- Espaço generoso entre secções, mas lista de marcadores densa (estilo Whoop)
- Acentos de cor reservados para estados clínicos — cromaticamente vivos, nunca berrantes
- Sparklines minimalistas, sem grelha
- Sem gradientes pesados, sem sombras dramáticas — elevação subtil por borda 1px
- Microcopy em português europeu, tom profissional mas próximo

---

## Detalhes técnicos

- Rota nova: `/utentes/$utenteId` em `src/routes/utentes.$utenteId.tsx`. Index passa a redireccionar ou listar 1 utente que abre este ecrã.
- Substituir o placeholder em `src/routes/index.tsx` por uma landing mínima do portal com link para a Maria Antunes (para o ecrã 5 ser acessível por navegação real).
- Mock data tipado em `src/data/mock-utente.ts` (utente, marcadores, séries temporais, alvos funcionais, alertas).
- Componentes em `src/components/dashboard/`: `PatientHeader`, `AlertsBar`, `CategoryTabs`, `MarkerList`, `MarkerRow` (com sparkline), `MarkerDetailPanel`, `LongitudinalChart`, `StateTag`.
- Gráficos com **Recharts** (já compatível com a stack); sparklines com `<LineChart>` minimalista sem eixos.
- Tokens de cor adicionados em `src/styles.css`: `--state-ok`, `--state-warn`, `--state-alert` (oklch quente) + variantes `-soft` para fundos.
- Tipografia: adicionar Inter (corpo/números tabulares) e Instrument Serif ou similar para títulos do header de utente, via Google Fonts em `__root.tsx`.
- Estado de selecção do marcador em `useState` local (não em URL — mantém o ecrã isolado e simples).
- Componentes shadcn já presentes a reutilizar: `tabs`, `card`, `badge`, `button`, `avatar`, `separator`, `tooltip`, `scroll-area`.
- `head()` próprio para o ecrã com título "Maria Antunes — Vivara Health".
- Responsivo: em viewport < 1024px, lista de marcadores e painel de detalhe empilham verticalmente.

---

## Fora de âmbito (próximos passos)

App mobile do utente, ecrã de upload, revisão de OCR, lista de utentes, editor de nota com IA, configurador de alertas, autenticação, integrações reais (HealthKit, Withings, laboratórios), Lovable Cloud. Ficam para iterações seguintes.
