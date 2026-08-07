import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactsClient } from "@/components/contacts/contacts-client";

export const metadata = { title: "Emergency Contacts" };

export default async function ContactsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/contacts");

  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Emergency Contacts
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          The people GuardianX notifies, in order, when an SOS is sent.
        </p>
      </div>

      <ContactsClient userId={user.id} initialContacts={contacts ?? []} />
    </div>
  );
}