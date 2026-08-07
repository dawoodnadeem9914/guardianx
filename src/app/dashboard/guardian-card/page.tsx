import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { GuardianCardClient } from "@/components/guardian-card/guardian-card-client";

export const metadata = { title: "Guardian Card" };

export default async function GuardianCardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/guardian-card");

  const [{ data: medicalProfile }, { data: profile }, { data: topContact }, { data: latestDetection }] =
    await Promise.all([
      supabase.from("medical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("emergency_contacts")
        .select("name, relationship, phone")
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("emergency_detections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const patientName = medicalProfile?.full_name || profile?.full_name || "Not set";

  const detection = latestDetection
    ? {
        label: getFirstAidProtocol(latestDetection.emergency_type as EmergencyType).label,
        severity: latestDetection.severity,
        confidence: latestDetection.verified_confidence ?? latestDetection.confidence,
        detectedAt: latestDetection.created_at,
      }
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Guardian Card
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          A responder should be able to read everything on this card in about 5 seconds.
        </p>
      </div>

      <GuardianCardClient
        patientName={patientName}
        dateOfBirth={medicalProfile?.date_of_birth ?? null}
        bloodType={medicalProfile?.blood_type ?? null}
        allergies={medicalProfile?.allergies ?? null}
        conditions={medicalProfile?.conditions ?? null}
        medications={medicalProfile?.medications ?? null}
        emergencyContact={topContact ?? null}
        detection={detection}
        hasMedicalProfile={Boolean(medicalProfile)}
      />
    </div>
  );
}