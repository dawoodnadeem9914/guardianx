-- =========================================================
-- GuardianX — Migration 0007: family_invitations
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0006
-- already being applied.
-- =========================================================

-- =========================================================
-- family_invitations — a shareable-link invitation, not an emailed
-- one (no email service exists in this project, and none may be
-- installed this milestone). The inviter gets a copyable
-- /invite/[token] link to send however they like.
-- =========================================================
create table if not exists public.family_invitations (
                                                         id                   uuid primary key default gen_random_uuid(),
    inviter_user_id      uuid not null references auth.users (id) on delete cascade,
    -- Optional — capturing the intended recipient for display purposes
    -- only ("invited jane@example.com"). Delivery is always via the
    -- shareable link, never actual email sending.
    invitee_email        text,
    relationship         text not null,
    token                text not null unique,
    status               text not null default 'pending' check (
                                                                   status in ('pending', 'accepted', 'expired', 'revoked')
    ),
    -- What the invitee will be granted once they accept. Medical profile
    -- access defaults to false — the more sensitive permission requires
    -- an explicit opt-in by the inviter, not just a default yes.
    permissions          jsonb not null default '{
                          "view_emergency_status": true,
                          "view_guardian_card": true,
                          "view_medical_profile": false
                        }'::jsonb,
    expires_at           timestamptz not null,
    created_at           timestamptz not null default now(),
    accepted_at          timestamptz,
    accepted_by_user_id  uuid references auth.users (id) on delete set null
    );

create index if not exists idx_family_invitations_inviter
    on public.family_invitations (inviter_user_id);
create index if not exists idx_family_invitations_status
    on public.family_invitations (status);

alter table public.family_invitations enable row level security;

-- Inviter sees their own sent invitations; admin sees all.
create policy "Invitations are viewable by inviter or admin"
  on public.family_invitations for select
                                              using (auth.uid() = inviter_user_id or public.current_user_role() = 'admin');

create policy "Invitations are insertable by inviter"
  on public.family_invitations for insert
  with check (auth.uid() = inviter_user_id);

-- Covers the inviter revoking their own pending invitation, and admin
-- moderation. Deliberately does NOT cover the invitee accepting —
-- that's a different user than inviter_user_id, so it can never match
-- this policy. Acceptance goes through the accept_family_invitation()
-- SECURITY DEFINER function in migration 0008 instead, which updates
-- this row and creates the family_relationships row atomically.
create policy "Invitations are updatable by inviter or admin"
  on public.family_invitations for update
                                                     using (auth.uid() = inviter_user_id or public.current_user_role() = 'admin')
                                   with check (auth.uid() = inviter_user_id or public.current_user_role() = 'admin');

-- =========================================================
-- get_invitation_preview() — lets a logged-out visitor on
-- /invite/[token] see who invited them and as what relationship,
-- before they even have an account. A SECURITY DEFINER function
-- (rather than an open "anyone can select by token" RLS policy) keeps
-- tight control over exactly which columns are exposed — never
-- invitee_email, accepted_by_user_id, or the raw row.
-- =========================================================
create or replace function public.get_invitation_preview(p_token text)
returns table (
  relationship text,
  status text,
  expires_at timestamptz,
  inviter_full_name text
)
language sql
security definer
set search_path = public
stable
as $$
select
    fi.relationship,
    fi.status,
    fi.expires_at,
    p.full_name
from public.family_invitations fi
         left join public.profiles p on p.id = fi.inviter_user_id
where fi.token = p_token;
$$;

-- Explicit grants: this function must be callable by a logged-out
-- visitor (anon) as well as a logged-in one about to accept (authenticated).
grant execute on function public.get_invitation_preview(text) to anon, authenticated;