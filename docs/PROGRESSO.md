# Progresso do projeto Vivara Health

Resumo do que foi feito e decidido, para quem abre o projeto sem ter visto as sessões do Claude Code.
**Atualizar no fim de cada sessão de trabalho** (o que mudou, em que ramo, o que ficou por fazer).

## Onde está o código

- Repositório: `tmorais26/vivara-health-dashboard`
- `main`: portal do médico / clínica (Plano Médico, Plano Clínica). Produção no Vercel.
- `claude/vivara-user-app-a8lamd`: app do utente (rota `/app`). Só tem deploys de pré-visualização no Vercel.
- Os dois ramos **divergiram**: o ramo da app partiu de um `main` antigo (julho) e ainda não foi juntado.
- Supabase: projeto da Vivara em `eu-central-1`. Migrações em `supabase/migrations`, testes em `supabase/tests`.

## Novembro 2026

### Portal do médico (`main`, PRs #9–#18)

- 19/11: registo de médico com consentimentos RGPD (#9); chat opcional controlado pelo médico + notificações (#10); Plano Médico com agenda opcional, clínica do utente, exportar/importar (#11).
- 21/11: Supabase próprio + permissões do Plano Clínica com RLS (#12); atualização do TanStack Start por causa da CVE-2026-102989, que bloqueava o deploy (#13); revisão de UX que retira segurança falsa e corrige dados e textos (#14).
- 22/11: portal com dados reais, recomendações, documentos e medicação (#15); análises e exames, registo mais simples (#16); lembretes de consulta por email e pendências na ficha (#17); notificações úteis também no Plano Médico e preferências reais (#18).

### App do utente (`claude/vivara-user-app-a8lamd`)

- 18/11: um wearable de cada vez; idade biológica calculada a partir das análises; correção da XSS do TanStack Start.
- 19/11: calendário, notificações, assistente por regras e condições; consultas mostram «Marcada pelo médico»; nova paleta do chat e do assistente; o chat da médica trata a utente por «você»; criar conta e registo de consentimentos.
- 20–21/11: consentimentos passam a usar a tabela `profiles` do Supabase da Vivara; a app usa o projeto Supabase da Vivara (eu-central-1); erro de email recusado aparece junto do campo; programa de recomendação por código pessoal (parte 1).
- 22/11: recomendação do lado do utente ligada às funções do portal (`/registo?codigo=…&convite=…`, `validar_codigo`); Registos com vista de calendário; botão de calendário no Início; análises de laboratórios diferentes (tabela de unidades `lab-units.ts`, conversões, origem e duplicados).

### Site de marketing (`meu-site/`)

- React 19 + Vite + Tailwind, separado do portal. Deploy no projeto Vercel **`dist`** (produção em `dist-coral-one-31.vercel.app`), não no `vivara-plataforma-medico`.
- 27/11: o trabalho do ramo `claude/vivara-health-updates-ohyeuw` (6/7 a 22/11) vai para o `main` por PR: versão EN com seletor PT/EN; melhorias de UX de agosto; preços finais (membro 6,99 €/mês ou 79 €/ano, médico 29,99 €/mês ou 320 €/ano, preço por dia em destaque, em PT com o símbolo depois do valor); Privacidade, Termos e Acordo de Tratamento de Dados (rascunho); formulário de contacto via Web3Forms; página Começar; «Membros» para o particular e «paciente» no contexto do médico (rotas `/membros`, `/pacientes`, `/clinicas`; `/utentes` continua a funcionar); páginas Como funciona, Para médicos e Sobre redesenhadas; novas fotografias.
- Os deploys desse ramo no `vivara-plataforma-medico` davam ERROR porque o portal no ramo ainda tinha o TanStack Start de julho (bloqueado pela CVE-2026-102989). O site em si estava a ser publicado sem erros no projeto `dist`. Com o merge, o problema desaparece.

## Por fazer

- Juntar o ramo da app do utente ao `main`. Há conflitos em `package.json`, `package-lock.json`, `.gitignore`, `.env`, `src/routeTree.gen.ts`, `src/integrations/supabase/types.ts`, `src/lib/consent.functions.ts` e `src/app-v2.css`. O ramo também não tem as migrações e rotas que o `main` ganhou em novembro, por isso o merge tem de manter as duas partes.
- Site de marketing: o ecrã de login (`meu-site/src/components/SiteGate.jsx`) tem as credenciais escritas no código, por isso só esconde o site e não o protege. Falta decidir se sai quando o site abrir ao público ou se passa a usar a proteção do Vercel. Falta limpar `netlify.toml`, o README do template e os assets do Vite. Depois do merge, o projeto `dist` tem de passar a publicar a partir do `main`.
