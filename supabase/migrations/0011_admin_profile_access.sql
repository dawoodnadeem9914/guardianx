-- =========================================================
-- GuardianX — Migration 0011: admin profile access
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0010
-- already being applied.
--
-- This migration ADDS one new SELECT policy to the existing `profiles`
-- table (created in 0001). It never modifies that migration's SQL —
-- Postgres evaluates multiple permissive policies on the same
-- table/command with OR, so this simply widens who can read a row on
-- top of the existing "own row" and "linked family member" policies.
-- =========================================================

-- =========================================================
-- profiles — admins can see every profile, needed to build the user
-- list on the Admin dashboard's role-management page. `roles` already
-- has its own admin-visibility policy (migration 0006); this is the
-- matching policy for the name half of that list.
-- =========================================================
create policy "Profiles are viewable by admin"
  on public.profiles for select
                                    using (public.current_user_role() = 'admin');