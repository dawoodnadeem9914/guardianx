import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ArrowRight, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { SosStatusCard } from "@/components/sos/sos-status-card";
import { GuardianCardClient } from "@/components/guardian-card/guardian-card-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Family Live Updates" };

export default async function FamilyUpdatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/family-updates");

  const [
    { data: latestSosRequest },
    { data: medicalProfile },
    { data: profile },
    { data: topContact },
  ] = await Promise.all([
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

  const patientName = medicalProfile?.full_name || profile?.full_name || "Not set";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Family Live Updates
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          A preview of what{" "}
          {latestSosRequest?.guardian_contact_snapshot?.name ?? "your emergency contact"} would
          see during an active SOS.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.05] p-4 text-sm text-foreground-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-info" />
        <p>
          This page shows a simulated family-facing view using your real account data. A
          separate login for family members isn&apos;t built yet — for now, this is exactly what
          they would be shown.
        </p>
      </div>

      {latestSosRequest ? (
        <>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guardian Report</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground-muted">
                  The full incident summary, evidence, and timeline.
                </p>
                <Button size="sm" variant="secondary" className="mt-4" asChild>
                  <Link href="/dashboard/guardian-report">
                    View Guardian Report
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users size={16} className="text-teal-strong dark:text-teal" />
                  Contact information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {latestSosRequest.guardian_contact_snapshot ? (
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {latestSosRequest.guardian_contact_snapshot.name}
                      {latestSosRequest.guardian_contact_snapshot.relationship && (
                        <span className="ml-1.5 font-normal text-foreground-muted">
                          ({latestSosRequest.guardian_contact_snapshot.relationship})
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-foreground-muted">
                      {latestSosRequest.guardian_contact_snapshot.phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground-muted">
                    No contact was selected for this SOS.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
            <Users size={20} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No active SOS</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Family Live Updates will appear here once an SOS is sent.
            </p>
          </div>
          <Button size="sm" className="mt-1" asChild>
            <Link href="/dashboard/sos">Go to SOS</Link>
          </Button>
        </Card>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
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
            latestSosRequest
              ? {
                  label: getFirstAidProtocol(latestSosRequest.emergency_type as EmergencyType)
                    .label,
                  severity: latestSosRequest.severity,
                  confidence: latestSosRequest.confidence,
                  detectedAt: latestSosRequest.created_at,
                }
              : null
          }
          hasMedicalProfile={Boolean(medicalProfile)}
        />
      </div>
    </div>
  );
}