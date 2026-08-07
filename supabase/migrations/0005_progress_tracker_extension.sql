-- =========================================================
-- GuardianX — Migration 0005: Emergency Progress Tracker extension
-- Run this in the Supabase SQL Editor (or via `supabase db push`
-- if you've linked the CLI to your project). Depends on 0001–0004
-- already being applied.
--
-- This migration is purely additive/widening:
--   - Every existing sos_requests/emergency_reports status value
--     (preparing, sending, contact_notified, ready, completed,
--     cancelled, not_applicable) remains valid — the new constraints
--     are supersets of the old ones, so no existing row is affected.
--   - The two new columns are nullable, so every existing row is
--     valid with them simply unset.
-- =========================================================

-- =========================================================
-- Widen sos_requests.status to the full lifecycle:
--   preparing -> sending -> contact_notified -> ready ->
--   emergency_services_requested -> ambulance_en_route ->
--   hospital_assigned -> hospital_arrival -> completed
-- ("cancelled" remains a valid non-sequence terminal state, as before.)
-- =========================================================
alter table public.sos_requests
drop constraint if exists sos_requests_status_check;

alter table public.sos_requests
    add constraint sos_requests_status_check
        check (
            status in (
                       'preparing',
                       'sending',
                       'contact_notified',
                       'ready',
                       'emergency_services_requested',
                       'ambulance_en_route',
                       'hospital_assigned',
                       'hospital_arrival',
                       'completed',
                       'cancelled'
                )
            );

-- New columns for the extended lifecycle. Both nullable — most of an
-- SOS's life has no ETA or hospital yet, and earlier statuses never set
-- them at all.
alter table public.sos_requests
    add column if not exists eta_minutes integer check (eta_minutes is null or eta_minutes >= 0),
    add column if not exists assigned_hospital text;

-- =========================================================
-- Widen emergency_reports.status to match (it's a superset of
-- SosStatus plus "not_applicable", per types/supabase.ts's
-- EmergencyReportStatus).
-- =========================================================
alter table public.emergency_reports
drop constraint if exists emergency_reports_status_check;

alter table public.emergency_reports
    add constraint emergency_reports_status_check
        check (
            status in (
                       'not_applicable',
                       'preparing',
                       'sending',
                       'contact_notified',
                       'ready',
                       'emergency_services_requested',
                       'ambulance_en_route',
                       'hospital_assigned',
                       'hospital_arrival',
                       'completed',
                       'cancelled'
                )
            );