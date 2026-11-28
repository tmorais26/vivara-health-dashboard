# Prompt para o chat do portal do médico: fila de validação da orientação nutricional

Copie o texto abaixo para o chat do projeto do portal (vivara-plataforma-medico).

---

Contexto: a app do utente da Vivara gera uma «orientação nutricional com AI» (alimentos a privilegiar e a reduzir, cada um ligado a um marcador das análises). O utente pode pedir validação a um profissional que esteja ligado a ele (recomendou-o por código ou convite do portal). O portal partilha a mesma base de dados Supabase. As tabelas e funções JÁ EXISTEM; NÃO as alteres nem cries migrações que lhes toquem.

Implementa no PORTAL a fila de validação.

1) Fila (nova página «Validações» no menu)
- Ler com `supabase.rpc('fila_validacao_nutricao')` (com a sessão do profissional). Devolve só os pedidos pendentes de utentes ligados a quem está autenticado:
  `pedido_id, orientacao_id, utente_user_id, utente_nome, portal_utente_id (pode vir null), versao, estado ('em_validacao' ou 'bloqueado'), pedido_em, gerado_em, entrada (jsonb), conteudo (jsonb), lang`.
- Lista ordenada por `pedido_em` (mais antigo primeiro), com nome do utente, data do pedido e estado. Se `portal_utente_id` vier preenchido, ligar à ficha do utente no portal.
- Contador no menu com o número de pedidos pendentes.

2) Rever
- Mostrar os marcadores que foram usados: `entrada.markers` = lista de `{name, value, unit, ref, date}`; e o perfil: `entrada.ageBand, entrada.sex, entrada.bmi, entrada.waistCm`.
- Se `estado = 'em_validacao'`: `conteudo = { itens: [{ tipo: 'privilegiar'|'reduzir', alimento, marcador, porque }], nota }` (texto gerado pela IA). Mostrar com a etiqueta «Gerado por AI · não validado».
- Se `estado = 'bloqueado'`: não há texto da IA; `conteudo = { motivos: [...] }` com o motivo (marcador em zona crítica, condição sensível, gravidez/amamentação…). Mostrar os motivos e deixar o profissional escrever a orientação de raiz.

3) Editar
- Editor simples por item: tipo (privilegiar/reduzir), alimento (até 120 caracteres), marcador (escolher da lista de `entrada.markers`), porquê (até 500 caracteres). Acrescentar, remover e reordenar itens. Campo «nota» geral e campo opcional «observação para o utente».
- O profissional pode escrever o que entender (é ele que valida e assina); o texto original da IA fica sempre guardado à parte.

4) Validar
- `supabase.rpc('validar_orientacao_nutricional', { p_orientacao: orientacao_id, p_conteudo: { itens, nota }, p_observacao })`.
- Devolve texto: 'ok' | 'sem_permissao' | 'sem_pedido' | 'conteudo_invalido' | 'nao_encontrada'. Tratar cada caso com uma mensagem simples; em 'ok' tirar da fila.
- Na app, o utente passa a ver «Validado por [nome], [data]». O nome vem de `medico_perfis.nome` (ou do nome de exibição do membro).

5) Regras
- Nunca mostrar nada de utentes que não estejam ligados ao profissional (a função já filtra; não fazer consultas diretas às tabelas).
- Português europeu, tratamento por «você», e versão EN se o portal já tiver troca de idioma.
- Acessibilidade: labels nos campos, erros junto de cada campo, navegável por teclado.

Antes de escrever código, diz-me os ecrãs e componentes que vais criar ou alterar.
