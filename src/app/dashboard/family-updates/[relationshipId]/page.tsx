import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { logActivity } from "@/lib/logging/activity-log";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { SosStatusCard } from "@/components/sos/sos-status-card";
import { GuardianCardClient } from "@/components/guardian-card/guardian-card-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Linked Family Member" };

export default async function FamilyRelationshipDetailPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/family-updates/${relationshipId}`);

  const { data: relationship } = await supabase
    .from("family_relationships")
    .select("*")
    .eq("id", relationshipId)
    .eq("status", "active")
    .maybeSingle();

  if (!relationship) notFound();

  // Belt-and-suspenders, matching every other role-sensitive page in this
  // milestone: RLS already restricts which relationship rows are visible
  // at all, but this explicit check is what prevents the PRIMARY user
  // (or an unrelated admin-adjacent session) from landing on a page that
  // was only ever meant for the family viewer's own eyes.
  const role = await getUserRole(supabase, user.id);
  const isAuthorized = relationship.family_user_id === user.id || role === "admin";
  if (!isAuthorized) notFound();

  const primaryUserId = relationship.primary_user_id;
  const permissions = relationship.permissions;

  const { data: primaryProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", primaryUserId)
    .maybeSingle();

  const primaryName = primaryProfile?.full_name || "This person";

  // Each block below only fetches (and only logs a view for) the
  // specific data category its permission actually grants — matching
  // the RLS policies in migration 0010 exactly, so "permission denied"
  // never happens silently; the app simply never asks.
  let latestDetection = null;
  let latestSosRequest = null;
  if (permissions.view_emergency_status) {
    const [{ data: detectionData }, { data: sosData }] = await Promise.all([
      supabase
        .from("emergency_detections")
        .select("*")
        .eq("user_id", primaryUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("sos_requests")
        .select("*")
        .eq("user_id", primaryUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    latestDetection = detectionData;
    latestSosRequest = sosData;
    await logActivity(supabase, user.id, "emergency_viewed", {
      target_user_id: primaryUserId,
      relationship_id: relationship.id,
    });
  }

  let medicalProfile = null;
  if (permissions.view_medical_profile) {
    const { data } = await supabase
      .from("medical_profiles")
      .select("*")
      .eq("user_id", primaryUserId)
      .maybeSingle();
    medicalProfile = data;
    await logActivity(supabase, user.id, "medical_profile_viewed", {
      target_user_id: primaryUserId,
      relationship_id: relationship.id,
    });
  }

  let topContact = null;
  if (permissions.view_guardian_card) {
    const { data } = await supabase
      .from("emergency_contacts")
      .select("name, relationship, phone")
      .eq("user_id", primaryUserId)
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle();
    topContact = data;
    await logActivity(supabase, user.id, "guardian_card_viewed", {
      target_user_id: primaryUserId,
      relationship_id: relationship.id,
    });
  }

  const hasAnyAccess =
    permissions.view_emergency_status ||
    permissions.view_guardian_card ||
    permissions.view_medical_profile;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/family-updates"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Family Updates
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {primaryName}
          </h1>
          <Badge variant="teal">{relationship.relationship}</Badge>
        </div>
      </div>

      {!hasAnyAccess && (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <Lock size={20} className="text-foreground-subtle" />
          <p className="text-sm text-foreground-muted">
            You don&apos;t currently have permission to view any of {primaryName}&apos;s data.
          </p>
        </Card>
      )}

      {permissions.view_emergency_status && (
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Emergency status
          </p>
          {latestSosRequest ? (
            <SosStatusCard
              status={latestSosRequest.status}
              emergencyLabel={
                getFirstAidProtocol(latestSosRequest.emergency_type as EmergencyType).label
              }
              severity={latestSosRequest.severity}
              confidence={latestSosRequest.confidence}
              createdAt={latestSosRequest.created_at}
              updatedAt={latestSosRequest.updated_at}
              contact={latestSosRequest.guardian_contact_snapshot}
              etaMinutes={latestSosRequest.eta_minutes}
              assignedHospital={latestSosRequest.assigned_hospital}
            />
          ) : (
            <Card className="border-success/25 bg-success/[0.04] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">No active emergency</p>
                  <p className="text-xs text-foreground-subtle">
                    {latestDetection
                      ? `Last detection: ${getFirstAidProtocol(latestDetection.emergency_type as EmergencyType).label}`
                      : "No detections on record."}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {permissions.view_guardian_card && (
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Guardian Card
          </p>
          <GuardianCardClient
            patientName={primaryName}
            dateOfBirth={permissions.view_medical_profile ? (medicalProfile?.date_of_birth ?? null) : null}
            bloodType={permissions.view_medical_profile ? (medicalProfile?.blood_type ?? null) : null}
            allergies={permissions.view_medical_profile ? (medicalProfile?.allergies ?? null) : null}
            conditions={permissions.view_medical_profile ? (medicalProfile?.conditions ?? null) : null}
            medications={permissions.view_medical_profile ? (medicalProfile?.medications ?? null) : null}
            emergencyContact={topContact}
            detection={
              latestDetection
                ? {
                    label: getFirstAidProtocol(latestDetection.emergency_type as EmergencyType)
                      .label,
                    severity: latestDetection.severity,
                    confidence: latestDetection.verified_confidence ?? latestDetection.confidence,
                    detectedAt: latestDetection.created_at,
                  }
                : null
            }
            hasMedicalProfile={permissions.view_medical_profile && Boolean(medicalProfile)}
          />
        </div>
      )}

      {permissions.view_medical_profile && !permissions.view_guardian_card && (
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Medical profile
          </p>
          {medicalProfile ? (
            <Card>
              <CardContent className="flex flex-col gap-2 p-5 text-sm">
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-foreground-subtle">Blood type</span>
                  <span className="font-medium text-foreground">
                    {medicalProfile.blood_type ?? "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-foreground-subtle">Allergies</span>
                  <span className="font-medium text-foreground">
                    {medicalProfile.allergies || "None recorded"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-foreground-subtle">Conditions</span>
                  <span className="font-medium text-foreground">
                    {medicalProfile.conditions || "None recorded"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed p-6 text-center">
              <p className="text-sm text-foreground-muted">
                {primaryName} hasn&apos;t completed a medical profile yet.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}