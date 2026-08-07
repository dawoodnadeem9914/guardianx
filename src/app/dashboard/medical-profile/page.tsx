import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MedicalProfileClient } from "@/components/medical-profile/medical-profile-client";

export const metadata = { title: "Medical Profile" };

export default async function MedicalProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/medical-profile");

  const { data: profile } = await supabase
    .from("medical_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Medical Profile
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Blood type, allergies, medications, and anything a responder should know.
        </p>
      </div>

      <MedicalProfileClient userId={user.id} initialProfile={profile} />
    </div>
  );
}