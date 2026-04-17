-- BANNERS/ANNOUNCEMENTS TABLE
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  image_url text not null default '',
  link_url text not null default '',
  is_active boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banners enable row level security;

drop policy if exists "Authenticated users can read banners" on public.banners;
create policy "Authenticated users can read banners"
on public.banners
for select
to authenticated
using (is_active = true and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now()));

drop policy if exists "Admins can manage banners" on public.banners;
create policy "Admins can manage banners"
on public.banners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
-- Enable UUID generation support
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- Lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

-- Vocabulary table
create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  korean_word text not null,
  english_meaning text not null,
  pronunciation text not null,
  created_at timestamptz not null default now()
);

-- Progress table
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  score integer not null default 0 check (score >= 0 and score <= 100),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper function to determine admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary enable row level security;
alter table public.progress enable row level security;

-- PROFILES policies
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- LESSONS policies
drop policy if exists "Authenticated users can read lessons" on public.lessons;
create policy "Authenticated users can read lessons"
on public.lessons
for select
to authenticated
using (true);

drop policy if exists "Admins can manage lessons" on public.lessons;
create policy "Admins can manage lessons"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- VOCABULARY policies
drop policy if exists "Authenticated users can read vocabulary" on public.vocabulary;
create policy "Authenticated users can read vocabulary"
on public.vocabulary
for select
to authenticated
using (true);

drop policy if exists "Admins can manage vocabulary" on public.vocabulary;
create policy "Admins can manage vocabulary"
on public.vocabulary
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PROGRESS policies
drop policy if exists "Users can read own progress" on public.progress;
create policy "Users can read own progress"
on public.progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own progress" on public.progress;
create policy "Users can insert own progress"
on public.progress
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own progress" on public.progress;
create policy "Users can update own progress"
on public.progress
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can delete own progress" on public.progress;
create policy "Users can delete own progress"
on public.progress
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Fixed admin bootstrap
-- 1) In Supabase Auth, create user:
--    email: admin01@beyond-hangeul.local
--    password: BHadmin@24
-- 2) Then run:
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin01@beyond-hangeul.local';

-- Shared dashboard data (cross-browser)
create table if not exists public.learning_modules (
  id uuid primary key default gen_random_uuid(),
  module_name text not null,
  topic_title text not null,
  resource_file_name text not null default '',
  resource_file_data text not null default '',
  resource_file_type text not null default '',
  resource_files jsonb not null default '[]'::jsonb,
  type text not null default 'free' check (type in ('free', 'paid')),
  price numeric,
  status text not null default 'active' check (status in ('active', 'draft')),
  container_id uuid references public.learning_containers(id) on delete set null,
  container_title text not null default '',
  container_subtitle text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.learning_modules add column if not exists container_id uuid references public.learning_containers(id) on delete set null;
alter table public.learning_modules add column if not exists container_title text not null default '';
alter table public.learning_modules add column if not exists container_subtitle text not null default '';
alter table public.learning_modules add column if not exists resource_files jsonb not null default '[]'::jsonb;

create table if not exists public.learning_containers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('module_pdf_added','module_pdf_updated','worksheet_added','worksheet_updated','container_added','module_added')),
  title text not null,
  message text not null,
  related_id text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Authenticated users can read own notifications" on public.notifications;
create policy "Authenticated users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins can create notifications" on public.notifications;
create policy "Admins can create notifications"
  on public.notifications
  for insert
  to authenticated
  with check (public.is_admin());

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default 'Learner',
  module_id text not null default 'premium-all-modules',
  amount numeric not null default 150,
  method text not null default 'GCash',
  proof_image text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.user_module_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  status text not null default 'unlocked' check (status in ('locked', 'unlocked')),
  granted_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.worksheet_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  worksheet_id text not null,
  quiz_percent integer not null default 0 check (quiz_percent >= 0 and quiz_percent <= 100),
  writing_percent integer not null default 0 check (writing_percent >= 0 and writing_percent <= 100),
  quiz_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, worksheet_id)
);

create table if not exists public.learning_worksheets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  access_type text not null default 'free' check (access_type in ('free', 'paid')),
  resource_file_name text not null default '',
  resource_file_data text not null default '',
  resource_file_type text not null default '',
  entries jsonb not null default '[]'::jsonb,
  description text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('active', 'draft')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  step_order integer not null,
  title text not null default '',
  description text not null default '',
  type text not null default 'info' check (type in ('module', 'worksheet', 'info')),
  enabled_types jsonb not null default '["info"]'::jsonb,
  linked_item_id text not null default '',
  linked_item_ids jsonb not null default '[]'::jsonb,
  linked_module_ids jsonb not null default '[]'::jsonb,
  linked_worksheet_ids jsonb not null default '[]'::jsonb,
  info_content text not null default '',
  created_at timestamptz not null default now()
);

alter table public.learning_modules enable row level security;
alter table public.learning_containers enable row level security;
alter table public.payment_records enable row level security;
alter table public.user_module_access enable row level security;
alter table public.worksheet_progress enable row level security;
alter table public.learning_worksheets enable row level security;
alter table public.module_progress enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_steps enable row level security;

drop policy if exists "Authenticated users can read learning modules" on public.learning_modules;
create policy "Authenticated users can read learning modules"
on public.learning_modules
for select
to authenticated
using (true);

drop policy if exists "Admins can manage learning modules" on public.learning_modules;
create policy "Admins can manage learning modules"
on public.learning_modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can read learning containers" on public.learning_containers;
create policy "Authenticated users can read learning containers"
on public.learning_containers
for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage learning containers" on public.learning_containers;
create policy "Admins can manage learning containers"
on public.learning_containers
for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can update own pending payments" on public.payment_records;
create policy "Users can update own pending payments"
on public.payment_records
for update
to authenticated
using ((user_id = auth.uid() and status = 'pending') or public.is_admin())
with check ((user_id = auth.uid() and status = 'pending') or public.is_admin());

drop policy if exists "Admins can delete payment records" on public.payment_records;
create policy "Admins can delete payment records"
on public.payment_records
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Users can read own module access" on public.user_module_access;
create policy "Users can read own module access"
on public.user_module_access
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage module access" on public.user_module_access;
create policy "Admins can manage module access"
on public.user_module_access
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own worksheet progress" on public.worksheet_progress;
create policy "Users can read own worksheet progress"
on public.worksheet_progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own worksheet progress" on public.worksheet_progress;
create policy "Users can insert own worksheet progress"
on public.worksheet_progress
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own worksheet progress" on public.worksheet_progress;
create policy "Users can update own worksheet progress"
on public.worksheet_progress
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can delete own worksheet progress" on public.worksheet_progress;
create policy "Users can delete own worksheet progress"
on public.worksheet_progress
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can read learning worksheets" on public.learning_worksheets;
create policy "Authenticated users can read learning worksheets"
on public.learning_worksheets
for select
to authenticated
using (true);

drop policy if exists "Admins can manage learning worksheets" on public.learning_worksheets;
create policy "Admins can manage learning worksheets"
on public.learning_worksheets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own module progress" on public.module_progress;
create policy "Users can read own module progress"
on public.module_progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own module progress" on public.module_progress;
create policy "Users can insert own module progress"
on public.module_progress
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own module progress" on public.module_progress;
create policy "Users can update own module progress"
on public.module_progress
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can delete own module progress" on public.module_progress;
create policy "Users can delete own module progress"
on public.module_progress
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can read learning paths" on public.learning_paths;
create policy "Authenticated users can read learning paths"
on public.learning_paths
for select
to authenticated
using (true);

drop policy if exists "Admins can manage learning paths" on public.learning_paths;
create policy "Admins can manage learning paths"
on public.learning_paths
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can read learning path steps" on public.learning_path_steps;
create policy "Authenticated users can read learning path steps"
on public.learning_path_steps
for select
to authenticated
using (true);

drop policy if exists "Admins can manage learning path steps" on public.learning_path_steps;
create policy "Admins can manage learning path steps"
on public.learning_path_steps
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
