-- =========================================================
-- GuardianX — Migration 0004: sos_requests, emergency_reports, ai_feedback
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001, 0002,
-- and 0003 already being applied.
-- =========================================================

-- =========================================================
-- sos_requests — one row per SOS attempt that actually starts
-- (i.e. the countdown completed — cancelling during hold or
-- countdown never creates a row). The row is then updated in place
-- as the simulated flow progresses: preparing -> sending ->
-- contact_notified -> ready -> completed. This is the one table
-- in this migration that needs an UPDATE policy, since an SOS is a
-- genuinely stateful process on a single record, not a series of
-- historical inserts.
-- =========================================================
create table if not exists public.sos_requests (
                                                   id                        uuid primary key default gen_random_uuid(),
    user_id                   uuid not null references auth.users (id) on delete cascade,
    detection_id              uuid references public.emergency_detections (id) on delete set null,
    contact_id                uuid references public.emergency_contacts (id) on delete set null,
    emergency_type            text not null,
    severity                  text not null check (severity in ('low', 'medium', 'high', 'critical')),
    confidence                numeric(5, 2) not null check (confidence >= 0 and confidence <= 100),
    status                    text not null default 'preparing' check (
                                                                          status in (
                                                                          'preparing', 'sending', 'contact_notified',
                                                                          'ready', 'completed', 'cancelled'
                                                                                    )
    ),
    -- Snapshot of the selected contact at the time the SOS was sent, so
    -- the record stays accurate even if the contact is later edited or
    -- removed from emergency_contacts.
    guardian_contact_snapshot jsonb,
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now()
    );

create index if not exists idx_sos_requests_user on public.sos_requests (user_id);
create index if not exists idx_sos_requests_user_created
    on public.sos_requests (user_id, created_at desc);

alter table public.sos_requests enable row level security;

create policy "SOS requests are viewable by owner"
  on public.sos_requests for select
                                        using (auth.uid() = user_id);

create policy "SOS requests are insertable by owner"
  on public.sos_requests for insert
  with check (auth.uid() = user_id);

create policy "SOS requests are updatable by owner"
  on public.sos_requests for update
                                               using (auth.uid() = user_id)
                             with check (auth.uid() = user_id);

-- Reuses the handle_updated_at() function created in 0001_init_profiles.sql
drop trigger if exists on_sos_requests_updated on public.sos_requests;
create trigger on_sos_requests_updated
    before update on public.sos_requests
    for each row execute procedure public.handle_updated_at();

-- =========================================================
-- emergency_reports — a Guardian Report is a point-in-time snapshot,
-- not a live document, so this table is select + insert only.
-- Regenerating a report creates a new row rather than mutating an
-- old one, which matches how a real incident report should behave
-- (a stable historical record, referenced by its own Report ID).
-- =========================================================
create table if not exists public.emergency_reports (
                                                        id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users (id) on delete cascade,
    detection_id    uuid references public.emergency_detections (id) on delete set null,
    sos_request_id  uuid references public.sos_requests (id) on delete set null,
    status          text not null check (
                                            status in (
                                            'not_applicable', 'preparing', 'sending', 'contact_notified',
                                            'ready', 'completed', 'cancelled'
                                                      )
    ),
    -- Full structured report payload (incident summary, detection summary,
    -- verification, evidence, confidence, severity, first-aid summary,
    -- medical profile summary, emergency contact, timeline, current status).
    -- Stored as jsonb so a future PDF renderer can consume it directly
    -- without any schema change here.
    report_data     jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
    );

create index if not exists idx_emergency_reports_user on public.emergency_reports (user_id);
create index if not exists idx_emergency_reports_user_created
    on public.emergency_reports (user_id, created_at desc);

alter table public.emergency_reports enable row level security;

create policy "Emergency reports are viewable by owner"
  on public.emergency_reports for select
                                             using (auth.uid() = user_id);

create policy "Emergency reports are insertable by owner"
  on public.emergency_reports for insert
  with check (auth.uid() = user_id);

-- =========================================================
-- ai_feedback — architecture only for Milestone 4. No UI writes to
-- this table yet (nothing in this milestone submits feedback), but
-- Section 13/17 of the spec require the storage layer to exist so a
-- future "Helpful / Not Helpful" control can write to it with zero
-- schema changes. Select + insert only; feedback is immutable once
-- given, same reasoning as emergency_reports.
-- =========================================================
create table if not exists public.ai_feedback (
                                                  id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users (id) on delete cascade,
    detection_id   uuid references public.emergency_detections (id) on delete cascade,
    report_id      uuid references public.emergency_reports (id) on delete cascade,
    is_helpful     boolean not null,
    feedback_text  text,
    created_at     timestamptz not null default now()
    );

create index if not exists idx_ai_feedback_user on public.ai_feedback (user_id);

alter table public.ai_feedback enable row level security;

create policy "AI feedback is viewable by owner"
  on public.ai_feedback for select
                                       using (auth.uid() = user_id);

create policy "AI feedback is insertable by owner"
  on public.ai_feedback for insert
  with check (auth.uid() = user_id);