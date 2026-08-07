import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmergencyDetectionClient } from "@/components/emergency-detection/emergency-detection-client";

export const metadata = { title: "AI Emergency Detection" };

export default async function EmergencyDetectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/emergency");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          AI Emergency Detection
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Describe what you&apos;re seeing, or upload a photo — GuardianX will help you figure
          out what&apos;s happening and what to do next.
        </p>
      </div>

      <EmergencyDetectionClient userId={user.id} />
    </div>
  );
}