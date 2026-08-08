"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logging/activity-log";
import { Button } from "@/components/ui/button";

interface AcceptInvitationButtonProps {
  token: string;
  userId: string;
}

export function AcceptInvitationButton({ token, userId }: AcceptInvitationButtonProps) {
  const router = useRouter();
  const [accepting, setAccepting] = React.useState(false);

  async function handleAccept() {
    setAccepting(true);
    const supabase = createClient();

    const { data, error } = await supabase.rpc("accept_family_invitation", { p_token: token });

    if (error || !data) {
      setAccepting(false);
      toast.error(
        error?.message ||
          "Couldn't accept this invitation. It may have expired or already been used."
      );
      return;
    }

    await logActivity(supabase, userId, "invitation_accepted", {
      relationship_id: data.id,
      primary_user_id: data.primary_user_id,
    });

    toast.success("Invitation accepted — you're now linked.");
    router.push("/dashboard/family-updates");
    router.refresh();
  }

  return (
    <Button onClick={handleAccept} disabled={accepting} size="lg" className="w-full">
      {accepting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Accepting…
        </>
      ) : (
        <>
          <Check size={16} />
          Accept invitation
        </>
      )}
    </Button>
  );
}