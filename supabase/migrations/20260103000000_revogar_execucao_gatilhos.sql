-- As funções de gatilho não devem ser chamáveis pela API.
revoke execute on function public.tg_consulta_segue(), public.tg_mesmo_espaco(),
  public.tg_utente_criador_segue(), public.tg_espaco_imutavel() from public, anon, authenticated;
