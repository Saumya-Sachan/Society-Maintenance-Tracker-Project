
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_complaint_change() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Storage policies for the private complaint-photos bucket
create policy "photos: residents upload own" on storage.objects for insert to authenticated
with check (bucket_id = 'complaint-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: residents read own" on storage.objects for select to authenticated
using (bucket_id = 'complaint-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: admins read all complaint photos" on storage.objects for select to authenticated
using (bucket_id = 'complaint-photos' and public.is_admin(auth.uid()));

create policy "photos: residents delete own" on storage.objects for delete to authenticated
using (bucket_id = 'complaint-photos' and (storage.foldername(name))[1] = auth.uid()::text);
