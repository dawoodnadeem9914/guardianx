import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Role-Based Access Control foundation.
 *
 * Mirrors the `roles` table's check constraint from migration 0006
 * exactly — if that constraint's allowed values ever change, this type
 * must change with it (and vice versa).
 */
export type Role = "user" | "family" | "hospital" | "campus_admin" | "admin";

export const ALL_ROLES: Role[] = ["user", "family", "hospital", "campus_admin", "admin"];

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  family: "Family",
  hospital: "Hospital",
  campus_admin: "Campus Admin",
  admin: "Admin",
};

/**
 * Fetches the given user's role. Defaults to "user" if no row exists —
 * shouldn't happen after migration 0006's backfill and signup trigger,
 * but failing safe to the least-privileged role (rather than throwing)
 * keeps every caller simple and never accidentally grants access.
 */
export async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Role> {
  const { data } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.role as Role | undefined) ?? "user";
}

/**
 * True if `role` is one of `allowed`. Admins always pass — admin is
 * treated as a superset of every other role's page access throughout
 * this project, consistent with how `current_user_role() = 'admin'` is
 * used as the override condition in every RLS policy this milestone
 * adds (migrations 0006–0009).
 */
export function hasRole(role: Role, allowed: Role[]): boolean {
  return role === "admin" || allowed.includes(role);
}