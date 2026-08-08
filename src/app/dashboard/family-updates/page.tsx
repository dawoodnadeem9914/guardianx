import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FamilyClient, type EnrichedRelationship } from "@/components/family/family-client";

export const metadata = { title: "Family Updates" };

export default async function FamilyUpdatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/family-updates");

  const [{ data: sentInvitations }, { data: monitoringMeRaw }, { data: monitoredByMeRaw }] =
    await Promise.all([
      supabase
        .from("family_invitations")
        .select("*")
        .eq("inviter_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      // Relationships where I am the primary user — people who can see MY data.
      supabase
        .from("family_relationships")
        .select("*")
        .eq("primary_user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      // Relationships where I am the family user — people whose data I can see.
      supabase
        .from("family_relationships")
        .select("*")
        .eq("family_user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

  // Batch-fetch the "other party" profile name for every relationship in
  // one query rather than N+1 — RLS (migration 0010) allows reading a
  // linked family member's basic profile in either direction.
  const otherPartyIds = new Set<string>();
  (monitoringMeRaw ?? []).forEach((r) => otherPartyIds.add(r.family_user_id));
  (monitoredByMeRaw ?? []).forEach((r) => otherPartyIds.add(r.primary_user_id));

  const nameById = new Map<string, string>();
  if (otherPartyIds.size > 0) {
    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(otherPartyIds));

    (otherProfiles ?? []).forEach((p) => {
      nameById.set(p.id, p.full_name || "Unnamed user");
    });
  }

  const monitoringMe: EnrichedRelationship[] = (monitoringMeRaw ?? []).map((r) => ({
    id: r.id,
    otherPartyUserId: r.family_user_id,
    otherPartyName: nameById.get(r.family_user_id) ?? "Unnamed user",
    relationship: r.relationship,
    permissions: r.permissions,
    createdAt: r.created_at,
  }));

  const monitoredByMe: EnrichedRelationship[] = (monitoredByMeRaw ?? []).map((r) => ({
    id: r.id,
    otherPartyUserId: r.primary_user_id,
    otherPartyName: nameById.get(r.primary_user_id) ?? "Unnamed user",
    relationship: r.relationship,
    permissions: r.permissions,
    createdAt: r.created_at,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Family Updates
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Invite family members to monitor your emergency status, and manage who can see what.
        </p>
      </div>

      <FamilyClient
        userId={user.id}
        initialSentInvitations={sentInvitations ?? []}
        initialMonitoringMe={monitoringMe}
        monitoredByMe={monitoredByMe}
      />
    </div>
  );
}