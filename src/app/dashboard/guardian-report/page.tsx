import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuardianReportClient } from "@/components/guardian-report/guardian-report-client";

export const metadata = { title: "Guardian Report" };

export default async function GuardianReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/guardian-report");

  const [
    { data: initialReport },
    { data: latestDetection },
    { data: medicalProfile },
    { data: topContact },
    { data: latestSosRequest },
  ] = await Promise.all([
    supabase
      .from("emergency_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("emergency_detections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("medical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sos_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Guardian Report
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          A structured, shareable record of your latest incident — ready for a future PDF
          exporter to read from directly.
        </p>
      </div>

      <GuardianReportClient
        userId={user.id}
        initialReport={initialReport}
        latestDetection={latestDetection}
        medicalProfile={medicalProfile}
        topContact={topContact}
        latestSosRequest={latestSosRequest}
      />
    </div>
  );
}