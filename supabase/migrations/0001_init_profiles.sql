-- =========================================================
-- GuardianX — Migration 0001: profiles
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project).
-- =========================================================

-- One row per authenticated user, keyed to auth.users(id).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read only their own profile.
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update only their own profile.
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Inserts happen exclusively via the trigger below (security definer),
-- so no direct insert policy is granted to authenticated users.

-- Automatically create a profile row whenever a new auth user signs up.
-- Reads the full name from the signup metadata if the register form
-- passed one in `options.data.full_name`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current on every profile update.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
