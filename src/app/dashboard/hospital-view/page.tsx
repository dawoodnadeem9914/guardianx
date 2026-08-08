import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, Info, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasRole } from "@/lib/auth/roles";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { getEmergencyTimeline } from "@/lib/report/emergency-timeline";
import { SosStatusCard } from "@/components/sos/sos-status-card";
import { GuardianCardClient } from "@/components/guardian-card/guardian-card-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Hospital Dashboard" };

export default async function HospitalViewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/hospital-view");

  // Belt-and-suspenders with middleware.ts: middleware already redirects
  // non-hospital/non-admin users away from this path, but this Server
  // Component check is what actually prevents the page from rendering,
  // matching every other role-sensitive page in this milestone.
  const role = await getUserRole(supabase, user.id);
  if (!hasRole(role, ["hospital"])) redirect("/dashboard");

  const [{ data: latestSosRequest }, { data: medicalProfile }, { data: profile }, { data: topContact }] =
    await Promise.all([
      supabase
        .from("sos_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("medical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("emergency_contacts")
        .select("name, relationship, phone")
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  // Prefer the detection linked to the latest SOS (most relevant to an
  // "incoming patient"); fall back to the most recent detection overall
  // so the preview still shows something meaningful before any SOS exists.
  const { data: detection } = latestSosRequest?.detection_id
    ? await supabase
        .from("emergency_detections")
        .select("*")
        .eq("id", latestSosRequest.detection_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : await supabase
        .from("emergency_detections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  const patientName = medicalProfile?.full_name || profile?.full_name || "Not set";

  const confirmedEvidence = detection
    ? detection.evidence.filter((item) => detection.verification_responses?.[item])
    : [];
  const deniedEvidence = detection
    ? detection.evidence.filter(
        (item) => detection.verification_responses && !detection.verification_responses[item]
      )
    : [];

  const guidanceTimeline = detection
    ? getEmergencyTimeline(detection.emergency_type as EmergencyType)
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hospital Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          A read-only preview of what a receiving hospital would see for an incoming patient.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.05] p-4 text-sm text-foreground-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-info" />
        <p>
          This view is restricted to accounts with the Hospital role, assigned by an
          administrator — there&apos;s no public sign-up flow for hospital staff yet. The data
          shown is your own account&apos;s, standing in for a real incoming patient until
          hospital-side patient lookup is built.
        </p>
      </div>

      {latestSosRequest && (
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
      )}

      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          <Stethoscope size={14} />
          Guardian Card
        </p>
        <GuardianCardClient
          patientName={patientName}
          dateOfBirth={medicalProfile?.date_of_birth ?? null}
          bloodType={medicalProfile?.blood_type ?? null}
          allergies={medicalProfile?.allergies ?? null}
          conditions={medicalProfile?.conditions ?? null}
          medications={medicalProfile?.medications ?? null}
          emergencyContact={topContact ?? null}
          detection={
            detection
              ? {
                  label: getFirstAidProtocol(detection.emergency_type as EmergencyType).label,
                  severity: detection.severity,
                  confidence: detection.verified_confidence ?? detection.confidence,
                  detectedAt: detection.created_at,
                }
              : null
          }
          hasMedicalProfile={Boolean(medicalProfile)}
        />
      </div>

      {detection && detection.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <ul className="flex flex-col gap-1.5">
              {confirmedEvidence.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                  {item}
                </li>
              ))}
              {deniedEvidence.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-foreground-subtle line-through"
                >
                  <XCircle size={14} className="shrink-0 text-foreground-subtle" />
                  {item}
                </li>
              ))}
            </ul>
            {detection.reason && (
              <p className="text-sm text-foreground-muted">{detection.reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {guidanceTimeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="flex flex-col gap-3">
              {guidanceTimeline.map((step) => (
                <li key={step.label} className="flex gap-3">
                  <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    {step.label}
                  </span>
                  <span className="text-sm text-foreground-muted">{step.instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guardian Report</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground-muted">
            The full structured incident report, ready to share with the care team.
          </p>
          <Button size="sm" variant="secondary" className="mt-4" asChild>
            <Link href="/dashboard/guardian-report">
              View Guardian Report
              <ArrowRight size={14} />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}