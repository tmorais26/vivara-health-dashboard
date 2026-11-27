# Progresso do projeto Vivara Health

Resumo do que foi feito e decidido, para quem abre o projeto sem ter visto as sessões do Claude Code.
**Atualizar no fim de cada sessão de trabalho** (o que mudou, em que ramo, o que ficou por fazer).

## Onde está o código

- Repositório: `tmorais26/vivara-health-dashboard`
- `main`: portal do médico / clínica (Plano Médico, Plano Clínica). Produção no Vercel.
- App do utente: rota `/app-v2` (e `/registo`), no mesmo site e no mesmo `main` do portal. O ramo antigo `claude/vivara-user-app-a8lamd` foi juntado ao `main` a 27/11 (PR "Junta a app do utente ao main").
- Em novembro houve duas linhas de trabalho paralelas (portal e app); ficaram juntas a 27/11. A maquete antiga `/app` (apagada no #16) não voltou; `/app-v2` foi recuperada.
- Supabase: projeto da Vivara em `eu-central-1`. Migrações em `supabase/migrations`, testes em `supabase/tests`.

## Novembro 2026

### Portal do médico (`main`, PRs #9–#18)

- 19/11: registo de médico com consentimentos RGPD (#9); chat opcional controlado pelo médico + notificações (#10); Plano Médico com agenda opcional, clínica do utente, exportar/importar (#11).
- 21/11: Supabase próprio + permissões do Plano Clínica com RLS (#12); atualização do TanStack Start por causa da CVE-2026-102989, que bloqueava o deploy (#13); revisão de UX que retira segurança falsa e corrige dados e textos (#14).
- 22/11: portal com dados reais, recomendações, documentos e medicação (#15); análises e exames, registo mais simples (#16); lembretes de consulta por email e pendências na ficha (#17); notificações úteis também no Plano Médico e preferências reais (#18).

### App do utente (`/app-v2`, juntada ao `main` a 27/11)

- 18/11: um wearable de cada vez; idade biológica calculada a partir das análises; correção da XSS do TanStack Start.
- 19/11: calendário, notificações, assistente por regras e condições; consultas mostram «Marcada pelo médico»; nova paleta do chat e do assistente; o chat da médica trata a utente por «você»; criar conta e registo de consentimentos.
- 20–21/11: consentimentos passam a usar a tabela `profiles` do Supabase da Vivara; a app usa o projeto Supabase da Vivara (eu-central-1); erro de email recusado aparece junto do campo; programa de recomendação por código pessoal (parte 1).
- 22/11: recomendação do lado do utente ligada às funções do portal (`/registo?codigo=…&convite=…`, `validar_codigo`); Registos com vista de calendário; botão de calendário no Início; análises de laboratórios diferentes (tabela de unidades `lab-units.ts`, conversões, origem e duplicados).

## Por fazer

- Testar a app do utente já no `main` com o Supabase real: registo com consentimentos, recomendação por código (`/registo?codigo=&convite=`), análises, calendário. Só a compilação (`tsc`, `vite build`) foi verificada no merge.
- Aplicar no Supabase a migração `20261119120000_consent_register.sql` (`consent_events`, `account_closures`, `profiles.invite_code`) se ainda não estiver aplicada.
- `consent.functions.ts` do utente passou para `consent-utente.functions.ts`; o do médico manteve o nome original.
- Não há migração no repositório que crie a tabela `profiles`; existe na base mas não está versionada.

## Merge da app do utente (27/11)

- Resolução dos conflitos: `__root.tsx` fica igual ao `main` com os prefixos públicos `/app-v2` e `/registo` (passam direto por `children`, sem as regras do médico); `vite.config.ts` junta preset `vercel`, cron `/api/lembretes` e região `fra1`; `types.ts` é a união das tabelas e funções; `@tanstack/*` fixos em 1.170.42 / 1.168.61 / 1.168.43 (os `^` puxavam um `react-start` que pede Vite 8) — não descem da correção da CVE-2026-102989.
