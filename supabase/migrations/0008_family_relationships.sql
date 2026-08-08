-- =========================================================
-- GuardianX — Migration 0008: family_relationships
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0007
-- already being applied.
-- =========================================================

-- =========================================================
-- family_relationships — the durable record of a linked family
-- account. primary_user_id is the person being monitored (whose data
-- is shared); family_user_id is the person granted viewing access.
-- Revoking sets status = 'revoked' rather than deleting the row, so
-- history is preserved (consistent with how this project never
-- deletes emergency_detections/sos_requests either).
-- =========================================================
create table if not exists public.family_relationships (
                                                           id               uuid primary key default gen_random_uuid(),
    primary_user_id  uuid not null references auth.users (id) on delete cascade,
    family_user_id   uuid not null references auth.users (id) on delete cascade,
    relationship     text not null,
    permissions      jsonb not null default '{
                      "view_emergency_status": true,
                      "view_guardian_card": true,
                      "view_medical_profile": false
                    }'::jsonb,
    status           text not null default 'active' check (status in ('active', 'revoked')),
    invitation_id    uuid references public.family_invitations (id) on delete set null,
    created_at       timestamptz not null default now()
    );

create index if not exists idx_family_relationships_primary
    on public.family_relationships (primary_user_id);
create index if not exists idx_family_relationships_family
    on public.family_relationships (family_user_id);

-- Partial unique index (not a plain unique constraint): only one
-- ACTIVE relationship per pair is enforced, so a revoked-then-re-
-- invited pair can have multiple historical rows without conflicting.
-- accept_family_invitation() below relies on this exact index for its
-- ON CONFLICT clause.
create unique index if not exists uq_family_relationships_active_pair
    on public.family_relationships (primary_user_id, family_user_id)
    where status = 'active';

alter table public.family_relationships enable row level security;

-- Either party can see the relationship exists; admin sees all.
create policy "Family relationships are viewable by either party or admin"
  on public.family_relationships for select
                                                using (
                                                auth.uid() = primary_user_id
                                                or auth.uid() = family_user_id
                                                or public.current_user_role() = 'admin'
                                                );

-- Only the primary user (whose data is being shared) or an admin can
-- change permissions or revoke — this is a deliberate scope decision:
-- "relationship management" in this milestone means the primary user
-- managing who can see their data, not the family viewer self-removing.
-- No insert policy is granted — every row is created exclusively by
-- accept_family_invitation() below. No delete policy either, matching
-- this project's pattern of preserving history via a status column.
create policy "Family relationships are updatable by primary user or admin"
  on public.family_relationships for update
                                                using (auth.uid() = primary_user_id or public.current_user_role() = 'admin')
                                     with check (auth.uid() = primary_user_id or public.current_user_role() = 'admin');

-- =========================================================
-- accept_family_invitation() — the atomic accept operation.
--
-- Why this must be one SECURITY DEFINER function rather than two
-- client-side writes: the invitee (auth.uid()) is never the
-- inviter_user_id on family_invitations, so they have no RLS UPDATE
-- match on that table at all (by design — see migration 0007). This
-- function validates the token, marks the invitation accepted, and
-- creates (or reactivates) the relationship row in a single
-- transaction — so there's no window where one write could succeed
-- and the other fail or race against a second, concurrent accept of
-- the same token (the `for update` row lock below prevents that).
-- =========================================================
create or replace function public.accept_family_invitation(p_token text)
returns public.family_relationships
language plpgsql
security definer
set search_path = public
as $$
declare
v_invitation   public.family_invitations%rowtype;
  v_relationship public.family_relationships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invitation.';
end if;

select * into v_invitation
from public.family_invitations
where token = p_token
    for update;

if not found then
    raise exception 'This invitation could not be found.';
end if;

  if v_invitation.status <> 'pending' then
    raise exception 'This invitation is no longer available.';
end if;

  if v_invitation.expires_at < now() then
update public.family_invitations set status = 'expired' where id = v_invitation.id;
raise exception 'This invitation has expired.';
end if;

  if v_invitation.inviter_user_id = auth.uid() then
    raise exception 'You cannot accept your own invitation.';
end if;

update public.family_invitations
set status = 'accepted',
    accepted_at = now(),
    accepted_by_user_id = auth.uid()
where id = v_invitation.id;

insert into public.family_relationships (
    primary_user_id, family_user_id, relationship, permissions, invitation_id
)
values (
           v_invitation.inviter_user_id,
           auth.uid(),
           v_invitation.relationship,
           v_invitation.permissions,
           v_invitation.id
       )
    on conflict (primary_user_id, family_user_id) where status = 'active'
    do update set
    relationship  = excluded.relationship,
           permissions   = excluded.permissions,
           invitation_id = excluded.invitation_id,
           status        = 'active'
           returning * into v_relationship;

return v_relationship;
end;
$$;

grant execute on function public.accept_family_invitation(text) to authenticated;