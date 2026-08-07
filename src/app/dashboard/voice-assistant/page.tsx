import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { VoiceAssistantClient } from "@/components/voice/voice-assistant-client";

export const metadata = { title: "Voice Assistant" };

export default async function VoiceAssistantPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/voice-assistant");

  const { data: latestDetection } = await supabase
    .from("emergency_detections")
    .select("emergency_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const emergencyType = (latestDetection?.emergency_type as EmergencyType) ?? null;
  const emergencyLabel = emergencyType ? getFirstAidProtocol(emergencyType).label : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Voice Assistant
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          A hands-free, conversational way to get guidance — simulated for now, grounded in the
          same first-aid protocols as the rest of GuardianX.
        </p>
      </div>

      <VoiceAssistantClient emergencyType={emergencyType} emergencyLabel={emergencyLabel} />
    </div>
  );
}