-- =========================================================
-- GuardianX — Migration 0010: family cross-user data access
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0009
-- already being applied.
--
-- This migration ADDS new SELECT policies to 5 existing tables. It
-- never modifies the SQL in migrations 0001–0005 — Postgres evaluates
-- multiple permissive policies on the same table/command with OR, so
-- each policy below simply widens who can read a row, on top of the
-- existing "owner only" policy each table already has.
-- =========================================================

-- =========================================================
-- profiles — a linked family member (in either direction: the primary
-- user viewing their family member's name, or vice versa) can see the
-- other party's basic profile. Deliberately NOT gated by any specific
-- permission flag: knowing who you're linked to is baseline identity,
-- not a sensitive data category the fine-grained permissions control.
-- =========================================================
create policy "Profiles are viewable by linked family member"
  on public.profiles for select
                                    using (
                                    exists (
                                    select 1 from public.family_relationships fr
                                    where fr.status = 'active'
                                    and (
                                    (fr.primary_user_id = profiles.id and fr.family_user_id = auth.uid())
                                    or (fr.family_user_id = profiles.id and fr.primary_user_id = auth.uid())
                                    )
                                    )
                                    );

-- =========================================================
-- medical_profiles — gated strictly by view_medical_profile. This is
-- the one direction only (family_user viewing primary_user's medical
-- data) — a primary user doesn't need special access to their family
-- member's medical profile just because a relationship exists.
-- =========================================================
create policy "Medical profiles are viewable by permitted family member"
  on public.medical_profiles for select
                                            using (
                                            exists (
                                            select 1 from public.family_relationships fr
                                            where fr.status = 'active'
                                            and fr.primary_user_id = medical_profiles.user_id
                                            and fr.family_user_id = auth.uid()
                                            and (fr.permissions ->> 'view_medical_profile')::boolean = true
                                            )
                                            );

-- =========================================================
-- emergency_detections — gated by view_emergency_status.
-- =========================================================
create policy "Emergency detections are viewable by permitted family member"
  on public.emergency_detections for select
                                                using (
                                                exists (
                                                select 1 from public.family_relationships fr
                                                where fr.status = 'active'
                                                and fr.primary_user_id = emergency_detections.user_id
                                                and fr.family_user_id = auth.uid()
                                                and (fr.permissions ->> 'view_emergency_status')::boolean = true
                                                )
                                                );

-- =========================================================
-- sos_requests — gated by view_emergency_status (same permission as
-- detections; SOS status is part of "emergency status" as a concept).
-- =========================================================
create policy "SOS requests are viewable by permitted family member"
  on public.sos_requests for select
                                        using (
                                        exists (
                                        select 1 from public.family_relationships fr
                                        where fr.status = 'active'
                                        and fr.primary_user_id = sos_requests.user_id
                                        and fr.family_user_id = auth.uid()
                                        and (fr.permissions ->> 'view_emergency_status')::boolean = true
                                        )
                                        );

-- =========================================================
-- emergency_contacts — gated by view_guardian_card, since the primary
-- user's top emergency contact is one of the fields the Guardian Card
-- displays.
-- =========================================================
create policy "Emergency contacts are viewable by permitted family member"
  on public.emergency_contacts for select
                                              using (
                                              exists (
                                              select 1 from public.family_relationships fr
                                              where fr.status = 'active'
                                              and fr.primary_user_id = emergency_contacts.user_id
                                              and fr.family_user_id = auth.uid()
                                              and (fr.permissions ->> 'view_guardian_card')::boolean = true
                                              )
                                              );