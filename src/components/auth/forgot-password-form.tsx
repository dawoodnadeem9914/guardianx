"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          If an account exists for <span className="text-foreground">{email}</span>, we&apos;ve
          sent a link to reset your password. It expires shortly, so use it soon.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-strong hover:underline dark:text-teal">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Reset your password</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {error && <FormMessage type="error" message={error} />}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-strong hover:underline dark:text-teal">
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </div>
  );
}
