import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SosClient } from "@/components/sos/sos-client";

export const metadata = { title: "SOS" };

export default async function SosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/sos");

  const [{ data: latestDetection }, { data: contacts }, { data: medicalProfile }, { data: latestSosRequest }] =
    await Promise.all([
      supabase
        .from("emergency_detections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true }),
      supabase.from("medical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">SOS</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Hold the button for 3 seconds to alert your emergency contact and prepare your Guardian
          Card and Report.
        </p>
      </div>

      <SosClient
        userId={user.id}
        latestDetection={latestDetection}
        contacts={contacts ?? []}
        medicalProfile={medicalProfile}
        latestSosRequest={latestSosRequest}
      />
    </div>
  );
}