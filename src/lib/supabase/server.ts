import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session via Next.js's cookie store.
 *
 * NOTE: Server Components can't write cookies (Next.js restriction), so
 * the setAll() call is wrapped in a try/catch. This is safe as long as
 * middleware.ts is refreshing the session on every request, which it is.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component with no write access — safe to
          // ignore because middleware.ts refreshes the session cookie.
        }
      },
    },
  });
}
