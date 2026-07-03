
-- Roles
create type public.app_role as enum ('admin', 'resident');
create type public.complaint_status as enum ('open', 'in_progress', 'resolved');
create type public.complaint_priority as enum ('low', 'medium', 'high');
create type public.complaint_category as enum ('plumbing','electrical','cleaning','security','parking','lift','water_supply','gardening','common_area','other');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  flat_number text,
  block text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

-- Complaints
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references auth.users(id) on delete cascade,
  category complaint_category not null,
  description text not null,
  location text,
  contact_phone text,
  status complaint_status not null default 'open',
  priority complaint_priority not null default 'medium',
  photo_urls text[] not null default '{}',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index complaints_resident_idx on public.complaints(resident_id);
create index complaints_status_idx on public.complaints(status);
create index complaints_created_idx on public.complaints(created_at desc);
grant select, insert, update, delete on public.complaints to authenticated;
grant all on public.complaints to service_role;
alter table public.complaints enable row level security;

-- History
create table public.complaint_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  previous_status complaint_status,
  new_status complaint_status,
  previous_priority complaint_priority,
  new_priority complaint_priority,
  note text,
  event_type text not null,
  created_at timestamptz not null default now()
);
create index complaint_history_complaint_idx on public.complaint_history(complaint_id, created_at);
grant select, insert on public.complaint_history to authenticated;
grant all on public.complaint_history to service_role;
alter table public.complaint_history enable row level security;

-- Notices
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  important boolean not null default false,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notices_created_idx on public.notices(created_at desc);
grant select on public.notices to authenticated;
grant insert, update, delete on public.notices to authenticated;
grant all on public.notices to service_role;
alter table public.notices enable row level security;

-- Settings
create table public.society_settings (
  id int primary key default 1,
  overdue_threshold_days int not null default 7,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);
grant select on public.society_settings to authenticated;
grant insert, update on public.society_settings to authenticated;
grant all on public.society_settings to service_role;
alter table public.society_settings enable row level security;
insert into public.society_settings (id) values (1);

-- Policies: profiles
create policy "Profiles: user reads own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles: admins read all" on public.profiles for select to authenticated using (public.is_admin(auth.uid()));
create policy "Profiles: user updates own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Profiles: user inserts own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Policies: user_roles
create policy "Roles: user reads own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Roles: admins read all" on public.user_roles for select to authenticated using (public.is_admin(auth.uid()));

-- Policies: complaints
create policy "Complaints: residents read own" on public.complaints for select to authenticated using (auth.uid() = resident_id);
create policy "Complaints: admins read all" on public.complaints for select to authenticated using (public.is_admin(auth.uid()));
create policy "Complaints: residents insert own" on public.complaints for insert to authenticated with check (auth.uid() = resident_id);
create policy "Complaints: admins update any" on public.complaints for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Policies: history
create policy "History: residents read own complaint history" on public.complaint_history for select to authenticated using (
  exists (select 1 from public.complaints c where c.id = complaint_id and c.resident_id = auth.uid())
);
create policy "History: admins read all" on public.complaint_history for select to authenticated using (public.is_admin(auth.uid()));
create policy "History: authenticated inserts" on public.complaint_history for insert to authenticated with check (auth.uid() = actor_id);

-- Policies: notices
create policy "Notices: everyone signed in reads" on public.notices for select to authenticated using (true);
create policy "Notices: admins manage" on public.notices for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Notices: admins update" on public.notices for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Notices: admins delete" on public.notices for delete to authenticated using (public.is_admin(auth.uid()));

-- Policies: settings
create policy "Settings: everyone signed in reads" on public.society_settings for select to authenticated using (true);
create policy "Settings: admins update" on public.society_settings for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Auto profile + resident role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
  insert into public.user_roles (user_id, role) values (new.id, 'resident') on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Log complaint creation + updates
create or replace function public.log_complaint_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.complaint_history(complaint_id, actor_id, new_status, new_priority, event_type, note)
    values (new.id, new.resident_id, new.status, new.priority, 'created', 'Complaint submitted');
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status or new.priority is distinct from old.priority then
      insert into public.complaint_history(complaint_id, actor_id, previous_status, new_status, previous_priority, new_priority, event_type)
      values (new.id, auth.uid(), old.status, new.status, old.priority, new.priority,
              case when new.status is distinct from old.status then 'status_change' else 'priority_change' end);
      if new.status = 'resolved' and old.status <> 'resolved' then
        new.resolved_at = now();
      end if;
    end if;
    new.updated_at = now();
  end if;
  return new;
end $$;

create trigger complaints_log_insert after insert on public.complaints
for each row execute function public.log_complaint_change();

create trigger complaints_log_update before update on public.complaints
for each row execute function public.log_complaint_change();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger notices_touch before update on public.notices for each row execute function public.touch_updated_at();
