"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = React.useState(false);
  const [resent, setResent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setLoading(true);
    setError(null);
    setResent(false);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResent(true);
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
        <MailCheck size={22} />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        Confirm your email
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        We&apos;ve sent a confirmation link to{" "}
        <span className="text-foreground">{email || "your email address"}</span>. Click it to
        activate your account.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {error && <FormMessage type="error" message={error} />}
        {resent && <FormMessage type="success" message="Confirmation email resent." />}

        <Button variant="secondary" onClick={handleResend} disabled={loading || !email}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Resending…" : "Resend confirmation email"}
        </Button>
      </div>

      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-teal-strong hover:underline dark:text-teal">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
