-- =========================================================
-- GuardianX — Migration 0003: emergency_detections
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001 and
-- 0002 already being applied.
-- =========================================================

-- =========================================================
-- emergency_detections — one row per completed detection flow
-- (input -> simulated AI analysis -> user verification). Written
-- once, at the end of the flow, with both the original AI output
-- and the verification outcome — so there is no update policy,
-- only select + insert.
-- =========================================================
create table if not exists public.emergency_detections (
                                                           id                      uuid primary key default gen_random_uuid(),
    user_id                 uuid not null references auth.users (id) on delete cascade,
    input_type              text not null check (input_type in ('image', 'text')),
    input_summary           text not null,
    emergency_type          text not null,
    severity                text not null check (severity in ('low', 'medium', 'high', 'critical')),
    confidence              numeric(5, 2) not null check (confidence >= 0 and confidence <= 100),
    evidence                jsonb not null default '[]'::jsonb,
    reason                  text,
    verification_responses  jsonb,
    verified_confidence     numeric(5, 2) check (
                                                    verified_confidence is null
                                                    or (verified_confidence >= 0 and verified_confidence <= 100)
    ),
    created_at              timestamptz not null default now()
    );

create index if not exists idx_emergency_detections_user
    on public.emergency_detections (user_id);

create index if not exists idx_emergency_detections_user_created
    on public.emergency_detections (user_id, created_at desc);

alter table public.emergency_detections enable row level security;

create policy "Emergency detections are viewable by owner"
  on public.emergency_detections for select
                                                using (auth.uid() = user_id);

create policy "Emergency detections are insertable by owner"
  on public.emergency_detections for insert
  with check (auth.uid() = user_id);