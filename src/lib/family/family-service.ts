import type { FamilyPermissions } from "@/types/supabase";

/**
 * Pure family-invitation business logic. No Supabase calls here —
 * matches the pattern of every other `src/lib/` service in this
 * project (`detect-emergency.ts`, `send-sos.ts`, `campus-stats.ts`).
 * The caller (`family-client.tsx`, the `/invite/[token]` page) handles
 * the actual database reads/writes using these values.
 */

const DEFAULT_INVITATION_VALID_DAYS = 7;

/** Cryptographically random, unguessable — safe to use directly in a URL. */
export function generateInvitationToken(): string {
  return crypto.randomUUID();
}

/** Returns an ISO timestamp `daysValid` days from now. */
export function computeInvitationExpiry(
  daysValid: number = DEFAULT_INVITATION_VALID_DAYS
): string {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysValid);
  return expiry.toISOString();
}

export function isInvitationExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso).getTime() < Date.now();
}

/**
 * Default permissions for a new invitation — mirrors the database
 * column default exactly (migration 0007's `family_invitations.permissions`
 * default), so the invite form's initial state and the database's
 * fallback never drift apart into two different "defaults."
 */
export function defaultFamilyPermissions(): FamilyPermissions {
  return {
    view_emergency_status: true,
    view_guardian_card: true,
    view_medical_profile: false,
  };
}

/**
 * Builds the shareable invitation URL. Takes `origin` as a parameter
 * rather than reading `window.location` internally, so this function
 * stays pure and environment-agnostic — the caller computes `origin`
 * using the same `NEXT_PUBLIC_SITE_URL || window.location.origin`
 * pattern already established in `register-form.tsx` and
 * `forgot-password-form.tsx`.
 */
export function buildInvitationUrl(token: string, origin: string): string {
  return `${origin}/invite/${token}`;
}