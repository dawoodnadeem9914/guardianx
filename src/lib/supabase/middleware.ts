import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { hasRole, type Role } from "@/lib/auth/roles";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ONLY_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Paths that require a specific role beyond "just signed in." Checked
 * only after the base authentication check below already passes — this
 * narrows access further, it never replaces the sign-in requirement.
 * `hasRole()` already treats "admin" as a superset of every role, so it
 * never needs to be listed explicitly here — same convention as
 * `dashboard-nav.ts`'s `requiredRole` field, so the sidebar's *visible*
 * items and middleware's *enforced* access never drift apart.
 *
 * It's safe to list a path here before its page exists (e.g.
 * /dashboard/admin, built later in this same milestone) — this is a
 * URL-pattern rule, not a code import, so it has zero effect until a
 * request actually reaches that path.
 */
const ROLE_GATED_PATHS: { prefix: string; allowedRoles: Role[] }[] = [
  { prefix: "/dashboard/hospital-view", allowedRoles: ["hospital"] },
  { prefix: "/dashboard/campus-dashboard", allowedRoles: ["campus_admin"] },
  { prefix: "/dashboard/admin", allowedRoles: ["admin"] },
];

/**
 * Refreshes the Supabase auth session on every request (required so
 * Server Components always see an up-to-date session) and enforces
 * route protection:
 *   - /dashboard/*        -> requires a session, else redirect to /login
 *   - /login, /register…  -> requires NO session, else redirect to /dashboard
 *   - role-gated paths     -> requires the matching role, else redirect to /dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't configured yet, don't block local dev — just pass through.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role check only runs once we know the user is signed in — the
  // block above already redirected otherwise, so `user` is non-null here.
  if (user) {
    const roleGate = ROLE_GATED_PATHS.find((gate) => pathname.startsWith(gate.prefix));
    if (roleGate) {
      const { data: roleRow } = await supabase
        .from("roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const role: Role = roleRow?.role ?? "user";

      if (!hasRole(role, roleGate.allowedRoles)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}