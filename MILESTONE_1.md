# GuardianX — Milestone 1: Authentication &amp; Dashboard Shell

This milestone is fully functional against a real Supabase project. Nothing in it is mocked —
every button, form, and redirect is wired to a real Supabase Auth/Database call.

## 1. What's included

- Email/password **Register**, with email confirmation
- **Login**, with error handling and post-login redirect
- **Forgot password** → real recovery email
- **Reset password** → updates the real Supabase user
- **Email verification** page with a working "resend" action
- **Protected routes** — middleware + a server-side session check on `/dashboard`
- **Dashboard shell** — sidebar, responsive top nav, theme toggle (light/dark/system), user
  menu with real sign-out, and a dashboard home page reading real `profiles` data (no fake
  stats — features not yet built are shown as honestly disabled, not faked)

## 2. Required npm packages

Already installed in this project; listed here for reference:

```
next, react, react-dom, typescript
tailwindcss, @tailwindcss/postcss
framer-motion
next-themes
lucide-react
clsx, tailwind-merge, class-variance-authority
@radix-ui/react-slot, @radix-ui/react-dropdown-menu, @radix-ui/react-avatar
@radix-ui/react-dialog, @radix-ui/react-tabs, @radix-ui/react-accordion,
@radix-ui/react-navigation-menu, @radix-ui/react-tooltip, @radix-ui/react-switch
@supabase/supabase-js, @supabase/ssr
sonner
```

## 3. Supabase project setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. In **Authentication → URL Configuration**, set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/auth/confirm`
4. In **Authentication → Emails**, the default templates work as-is — Supabase's confirmation
   and recovery links already point to `{{ .SiteURL }}/auth/confirm?token_hash=...&type=...`,
   which matches the route handler in this project.
5. Open the **SQL Editor** and run the migration at `supabase/migrations/0001_init_profiles.sql`.
   This creates the `profiles` table, its row-level security policies, and a trigger that
   auto-creates a profile row (with the name from sign-up) whenever a new user registers.

## 4. Environment configuration

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave `OPENAI_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` blank — they belong to later
milestones and aren't used by anything in Milestone 1.

## 5. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 6. How to test every feature

| Feature | Steps |
|---|---|
| **Register** | Go to `/register`, submit the form → redirected to `/verify-email`. Check the inbox you signed up with. |
| **Email confirmation** | Click the link in the email → lands on `/dashboard`, now signed in. |
| **Resend confirmation** | On `/verify-email`, click "Resend confirmation email" → check inbox again. |
| **Login** | Go to `/login`, sign in with the confirmed account → redirected to `/dashboard`. |
| **Wrong password** | Try an incorrect password → inline error message, no crash. |
| **Protected routes** | While signed out, visit `/dashboard` directly → redirected to `/login?next=/dashboard`. Sign in → sent back to `/dashboard`. |
| **Auth-only routes while signed in** | While signed in, visit `/login` or `/register` → redirected straight to `/dashboard`. |
| **Forgot password** | On `/login`, click "Forgot password?" → enter email → check inbox for the reset link. |
| **Reset password** | Click the reset link → lands on `/reset-password` → set a new password → redirected to `/dashboard`. |
| **Theme toggle** | Click the sun/moon icon in the nav or dashboard top bar → theme switches and persists on reload. |
| **Sign out** | In the dashboard, open the user menu (top right) → "Sign out" → redirected to `/login`, and `/dashboard` becomes protected again. |
| **Responsive layout** | Resize below `lg` breakpoint (or use device toolbar) → navbar collapses to a mobile menu; dashboard sidebar collapses to a slide-in drawer. |

## 7. Database schema (Milestone 1 scope)

```
profiles
├── id            uuid, PK, references auth.users(id)
├── full_name     text
├── avatar_url    text
├── created_at    timestamptz
└── updated_at    timestamptz
```

RLS: users can `select`/`update` only their own row. Inserts happen exclusively via the
`handle_new_user` trigger on `auth.users`, which also reads `full_name` out of the sign-up
metadata GuardianX's register form sends.

Additional tables from the V3.0 specification (`emergency_incidents`, `ai_analysis_results`,
`sos_requests`, etc.) are intentionally **not** created yet — they arrive with the milestones
that actually use them, so the schema in this repo never gets ahead of working code.

## 8. Known limitations of this milestone (by design)

- Sidebar items beyond "Overview" (Report Emergency, Incident History, Emergency Contacts,
  Medical Profile, Simulation Mode, Settings) are visible but marked **Soon** and disabled —
  they are real upcoming milestones, not placeholder pages pretending to work.
- No OAuth providers (Google/Apple sign-in) — email/password only, per spec Section 8's
  Firebase Auth equivalent scope; can be added later if you want it before Milestone 2.
- Avatar upload is not implemented yet (the `avatar_url` column exists but is unused until
  Supabase Storage is wired up in a later milestone, per spec Section 8/25).
