create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  insert into public.profiles (id, email, full_name, phone, flat_number, block)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'flat_number',
    new.raw_user_meta_data->>'block'
  ) on conflict (id) do nothing;

  begin
    requested_role := (new.raw_user_meta_data->>'role')::public.app_role;
  exception when others then
    requested_role := 'resident';
  end;

  if requested_role is null or requested_role not in ('admin','resident') then
    requested_role := 'resident';
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role)
  on conflict do nothing;
  return new;
end $$;