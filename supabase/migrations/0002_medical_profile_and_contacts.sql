-- =========================================================
-- GuardianX — Migration 0002: medical_profiles + emergency_contacts
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on
-- 0001_init_profiles.sql already being applied (reuses its
-- handle_updated_at() function).
-- =========================================================

-- =========================================================
-- medical_profiles — one row per user, created/updated directly
-- from the Medical Profile page (unlike `profiles`, there is no
-- auto-create trigger here, since this data is optional and
-- user-initiated).
-- =========================================================
create table if not exists public.medical_profiles (
                                                       id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null unique references auth.users (id) on delete cascade,
    full_name      text not null,
    date_of_birth  date,
    gender         text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_type     text check (
                                  blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')
    ),
    height_cm      numeric(5, 2) check (height_cm is null or height_cm > 0),
    weight_kg      numeric(5, 2) check (weight_kg is null or weight_kg > 0),
    allergies      text,
    medications    text,
    conditions     text,
    notes          text,
    organ_donor    boolean not null default false,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
    );

alter table public.medical_profiles enable row level security;

create policy "Medical profile is viewable by owner"
  on public.medical_profiles for select
                                            using (auth.uid() = user_id);

create policy "Medical profile is insertable by owner"
  on public.medical_profiles for insert
  with check (auth.uid() = user_id);

create policy "Medical profile is updatable by owner"
  on public.medical_profiles for update
                                                   using (auth.uid() = user_id)
                                 with check (auth.uid() = user_id);

-- Reuses the handle_updated_at() function created in 0001_init_profiles.sql
drop trigger if exists on_medical_profiles_updated on public.medical_profiles;
create trigger on_medical_profiles_updated
    before update on public.medical_profiles
    for each row execute procedure public.handle_updated_at();

-- =========================================================
-- emergency_contacts — many rows per user, full CRUD from the
-- Emergency Contacts page.
-- =========================================================
create table if not exists public.emergency_contacts (
                                                         id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users (id) on delete cascade,
    name          text not null,
    relationship  text,
    phone         text not null,
    email         text,
    priority      integer not null default 1 check (priority >= 1),
    created_at    timestamptz not null default now()
    );

create index if not exists idx_emergency_contacts_user on public.emergency_contacts (user_id);
create index if not exists idx_emergency_contacts_priority
    on public.emergency_contacts (user_id, priority);

alter table public.emergency_contacts enable row level security;

create policy "Emergency contacts are viewable by owner"
  on public.emergency_contacts for select
                                              using (auth.uid() = user_id);

create policy "Emergency contacts are insertable by owner"
  on public.emergency_contacts for insert
  with check (auth.uid() = user_id);

create policy "Emergency contacts are updatable by owner"
  on public.emergency_contacts for update
                                                     using (auth.uid() = user_id)
                                   with check (auth.uid() = user_id);

create policy "Emergency contacts are deletable by owner"
  on public.emergency_contacts for delete
using (auth.uid() = user_id);