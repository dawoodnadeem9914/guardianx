import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SimulationClient } from "@/components/simulation/simulation-client";

export const metadata = { title: "Simulation Mode" };

export default async function SimulationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/simulation");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Simulation Mode
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Practice 10 emergency scenarios, step by step. Nothing here is sent anywhere — it&apos;s
          just you and the guidance.
        </p>
      </div>

      <SimulationClient />
    </div>
  );
}