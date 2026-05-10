-- BedVibe Supabase schema
-- Run this once in your Supabase project SQL editor.
-- Auth setup:
--   1. Go to Authentication → Providers and enable Email (with or without confirmations).
--   2. (Optional) Enable Google provider:
--        - Create OAuth credentials in Google Cloud Console (Web application).
--        - Authorized redirect URI: https://<your-project-ref>.supabase.co/auth/v1/callback
--        - Paste Client ID & Secret into Supabase Auth → Providers → Google.
--   3. Under Authentication → URL Configuration, add your app's redirect scheme
--      (e.g. bedvibe://auth-callback and exp://... for development) to "Additional Redirect URLs".

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Bed Maker',
  email text,
  is_premium boolean not null default false,
  avg_score int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  total_beds int not null default 0,
  weekly_score int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id);

create index if not exists profiles_weekly_score_idx
  on public.profiles (weekly_score desc);

create index if not exists profiles_avg_score_idx
  on public.profiles (avg_score desc);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Bed Maker'),
    new.email
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
