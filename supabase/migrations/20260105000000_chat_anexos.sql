-- Anexos do chat médico–utente: bucket privado, caminho {espaco_id}/{utente_id}/{ficheiro}.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-anexos', 'chat-anexos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

create or replace function public.anexo_utente(p_nome text)
returns uuid language sql immutable set search_path = public as $$
  select case when (storage.foldername(p_nome))[2] ~ '^[0-9a-f-]{36}$'
              then ((storage.foldername(p_nome))[2])::uuid end
$$;

create policy chat_anexos_ler on storage.objects for select to authenticated
  using (bucket_id = 'chat-anexos' and public.segue_utente(public.anexo_utente(name)));

create policy chat_anexos_enviar on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-anexos'
    and public.segue_utente(public.anexo_utente(name))
    and exists (select 1 from public.utentes u
                where u.id = public.anexo_utente(name) and u.chat_estado = 'ativo'
                  and u.espaco_id::text = (storage.foldername(name))[1])
  );

create policy chat_anexos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'chat-anexos' and public.segue_utente(public.anexo_utente(name)));
