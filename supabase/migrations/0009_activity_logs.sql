-- =========================================================
-- GuardianX — Migration 0009: activity_logs
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0008
-- already being applied.
-- =========================================================

-- =========================================================
-- activity_logs — append-only audit trail. `user_id` is always the
-- actor performing the action (e.g. the family member who viewed
-- someone else's data), never the subject — when an action is *about*
-- another user (viewing a linked relationship's emergency status, a
-- role change target, etc.), that target goes in `metadata`, not in
-- `user_id`. This keeps the insert policy simple: you can only ever
-- log actions you yourself performed.
-- =========================================================
create table if not exists public.activity_logs (
                                                    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    -- Free text, not a check-constrained enum — new action types (future
    -- milestones) can be logged without a migration, matching how
    -- emergency_type on emergency_detections is also free text.
    action      text not null,
    metadata    jsonb,
    created_at  timestamptz not null default now()
    );

create index if not exists idx_activity_logs_user on public.activity_logs (user_id);
create index if not exists idx_activity_logs_user_created
    on public.activity_logs (user_id, created_at desc);
create index if not exists idx_activity_logs_action on public.activity_logs (action);

alter table public.activity_logs enable row level security;

-- Owner sees their own log; admin sees everyone's (for future audit
-- tooling — no admin UI reads this table yet in this milestone, but
-- the policy is here so one can be added later with zero migration).
create policy "Activity logs are viewable by owner or admin"
  on public.activity_logs for select
                                         using (auth.uid() = user_id or public.current_user_role() = 'admin');

-- You can only ever log your own actions.
create policy "Activity logs are insertable by owner"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

-- No update or delete policy at all — an audit trail that can be
-- edited after the fact isn't an audit trail. Same immutability
-- principle already applied to emergency_reports and ai_feedback.