-- =========================================================
-- GuardianX — Migration 0006: roles (RBAC foundation)
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0005
-- already being applied.
-- =========================================================

-- =========================================================
-- roles — one row per user, mirroring the 1:1-with-user pattern
-- already used by `profiles` (migration 0001). A user's role is a
-- single value, not a multi-role array — matches every other table
-- in this project's "simplest thing that's still correct" approach.
-- =========================================================
create table if not exists public.roles (
                                            user_id     uuid primary key references auth.users (id) on delete cascade,
    role        text not null default 'user' check (
                                                       role in ('user', 'family', 'hospital', 'campus_admin', 'admin')
    ),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
    );

create index if not exists idx_roles_role on public.roles (role);

alter table public.roles enable row level security;

-- =========================================================
-- current_user_role() — SECURITY DEFINER helper.
--
-- Why this exists: an RLS policy on `roles` that says "admins can see
-- every row" would naively need to query `roles` to check the
-- requester's own role — which would re-trigger the same RLS policy
-- and recurse. Wrapping that lookup in a SECURITY DEFINER function
-- (owned by the migration-running role, which bypasses RLS) breaks the
-- recursion. This is the standard, documented pattern for role-based
-- RLS in Postgres/Supabase, and every later migration in this
-- milestone (0007–0009) reuses this same function for its own
-- admin-override policies rather than redefining the check.
-- =========================================================
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
select role from public.roles where user_id = auth.uid();
$$;

-- Owner can see their own role; admins can see everyone's (for the
-- Admin dashboard's user list in this same milestone).
create policy "Roles are viewable by owner or admin"
  on public.roles for select
                                 using (auth.uid() = user_id or public.current_user_role() = 'admin');

-- Only admins can change a role — this is the one policy in this
-- entire migration that matters most: a regular user must never be
-- able to update their own row here, or they could self-escalate to
-- 'admin'. No insert policy is granted at all; every row is created
-- exclusively by the trigger below.
create policy "Roles are updatable by admin only"
  on public.roles for update
                                 using (public.current_user_role() = 'admin')
                      with check (public.current_user_role() = 'admin');

-- Reuses the handle_updated_at() function created in 0001_init_profiles.sql
drop trigger if exists on_roles_updated on public.roles;
create trigger on_roles_updated
    before update on public.roles
    for each row execute procedure public.handle_updated_at();

-- =========================================================
-- Auto-create a 'user' role row whenever a new auth user signs up —
-- same pattern as handle_new_user() in 0001_init_profiles.sql.
-- =========================================================
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
insert into public.roles (user_id, role)
values (new.id, 'user');
return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
    after insert on auth.users
    for each row execute procedure public.handle_new_user_role();

-- =========================================================
-- Backfill: the trigger above only fires for users created AFTER this
-- migration runs. Every account created during Milestones 1–5 testing
-- needs a role row too, or they'll be treated as having no role by
-- anything that queries this table. Defaults everyone to 'user' —
-- the least-privileged role, and the one every existing account has
-- been behaving as all along.
-- =========================================================
insert into public.roles (user_id, role)
select id, 'user' from auth.users
    on conflict (user_id) do nothing;