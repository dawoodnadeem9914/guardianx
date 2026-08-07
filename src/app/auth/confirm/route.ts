import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the links Supabase sends in confirmation / password-recovery
 * emails, which arrive as:
 *   /auth/confirm?token_hash=...&type=signup|recovery|email_change&next=/dashboard
 *
 * On success, verifyOtp() establishes a real session (cookies are set by
 * the server Supabase client), then we redirect to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      redirect(next);
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("That link is invalid or has expired.")}`, request.url)
  );
}
