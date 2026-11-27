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

## Por fazer

- Juntar o ramo da app do utente ao `main`. Há conflitos em `package.json`, `package-lock.json`, `.gitignore`, `.env`, `src/routeTree.gen.ts`, `src/integrations/supabase/types.ts`, `src/lib/consent.functions.ts` e `src/app-v2.css`. O ramo também não tem as migrações e rotas que o `main` ganhou em novembro, por isso o merge tem de manter as duas partes.
