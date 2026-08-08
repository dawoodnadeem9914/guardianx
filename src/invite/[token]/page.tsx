import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isInvitationExpired } from "@/lib/family/family-service";
import { AcceptInvitationButton } from "@/components/family/accept-invitation-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Family Invitation" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // get_invitation_preview() is callable by anonymous visitors (granted
  // in migration 0007) — this page must render meaningfully for someone
  // who hasn't signed in yet, since that's the expected first visit.
  const { data: previewRows } = await supabase.rpc("get_invitation_preview", { p_token: token });
  const preview = previewRows?.[0];

  if (!preview) notFound();

  const expired = preview.status === "pending" && isInvitationExpired(preview.expires_at);
  const isActionable = preview.status === "pending" && !expired;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <div className="gx-grid-bg gx-glow-teal pointer-events-none absolute inset-0 -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="GuardianX home">
            <LogoMark size={30} />
          </Link>
        </div>

        <Card glass className="rounded-2xl p-8 text-center shadow-[0_20px_60px_-15px_hsl(var(--shadow-color)/0.4)]">
          {isActionable ? (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
                <Users size={22} />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                {preview.inviter_full_name ?? "Someone"} invited you
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                as their <span className="font-medium text-foreground">{preview.relationship}</span>{" "}
                on GuardianX — you&apos;ll be able to see their emergency status and Guardian Card
                according to the permissions they&apos;ve set.
              </p>

              <div className="mt-6">
                {user ? (
                  <AcceptInvitationButton token={token} userId={user.id} />
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/register?next=/invite/${token}`}>
                        Create an account to accept
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="w-full">
                      <Link href={`/login?next=/invite/${token}`}>I already have an account</Link>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-alt text-foreground-subtle">
                {preview.status === "accepted" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <XCircle size={22} />
                )}
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                {expired
                  ? "This invitation has expired"
                  : preview.status === "accepted"
                    ? "This invitation was already accepted"
                    : preview.status === "expired"
                      ? "This invitation has expired"
                      : "This invitation is no longer available"}
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                {expired || preview.status === "expired"
                  ? "Ask them to send you a new invitation."
                  : preview.status === "accepted"
                    ? "You should already be linked — check your Family Updates page."
                    : "This invitation was revoked."}
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-6 w-full">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}