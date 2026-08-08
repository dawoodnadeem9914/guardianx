import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";

/**
 * Activity actions this project logs. Kept as a union for autocomplete
 * and typo-safety at call sites, even though the underlying database
 * column is free text (see migration 0009) — a new action type can
 * still be logged later by widening this union, no migration required.
 */
export type ActivityAction =
  | "login"
  | "logout"
  | "invitation_sent"
  | "invitation_accepted"
  | "role_changed"
  | "emergency_viewed"
  | "guardian_card_viewed"
  | "medical_profile_viewed";

/**
 * Logs an activity event.
 *
 * Accepts an already-created Supabase client (browser or server)
 * rather than creating one internally — this is what lets the exact
 * same function be called from a Client Component (e.g. right after
 * sign-in, using the browser client) and a Server Component (e.g. when
 * a family member's relationship-detail page renders and needs to
 * record "emergency_viewed", using the server client). Same pattern as
 * `getUserRole()` in `lib/auth/roles.ts`.
 *
 * Never throws, and never surfaces an error to the caller — a logging
 * failure (network hiccup, RLS edge case) must never break the actual
 * user-facing action it's attached to. Failures are only warned to the
 * console for local debugging.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: ActivityAction,
  metadata?: Record<string, Json>
): Promise<void> {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      metadata: metadata ?? null,
    });

    if (error) {
      console.warn("[activity-log] failed to record activity:", error.message);
    }
  } catch (err) {
    console.warn("[activity-log] failed to record activity:", err);
  }
}