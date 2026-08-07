import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingContent } from "@/components/marketing/landing-content";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in visitors never see the marketing page — same pattern as
  // ChatGPT, Notion, Stripe, and Linear. Auth/session logic itself is
  // untouched; this only reads the existing session via the existing
  // server Supabase client.
  if (user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}