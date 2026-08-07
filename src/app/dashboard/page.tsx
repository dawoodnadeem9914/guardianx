import { redirect } from "next/navigation";
import {
  Siren,
  History,
  ShieldCheck,
  ShieldPlus,
  GraduationCap,
  Sparkles,
  Info,
  UserPlus,
  MailCheck,
  LogIn,
  Clock3,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = timeOfDayGreeting();

  const activity = buildActivity(user, profile?.created_at);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {/* ---------- Welcome header ---------- */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Here&apos;s what&apos;s happening with your GuardianX account.
        </p>
      </div>

      {/* ---------- Emergency status ---------- */}
      <Card className="border-success/25 bg-success/[0.04] p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="font-medium text-foreground">No active emergency</p>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Your account has no open incidents right now.
              </p>
            </div>
          </div>
          <Badge variant="low" className="shrink-0">
            All clear
          </Badge>
        </div>
      </Card>

      {/* ---------- Quick actions ---------- */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Quick actions
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <QuickAction icon={Siren} label="Report emergency" accent="critical" />
          <QuickAction icon={GraduationCap} label="Simulation mode" accent="teal" />
          <QuickAction icon={History} label="Incident history" accent="teal" />
          <QuickAction icon={ShieldPlus} label="Medical profile" accent="teal" />
        </div>
      </div>

      {/* ---------- Main grid ---------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity — real data only */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>A real log of what&apos;s happened on your account.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-1">
              {activity.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm"
                >
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                      (item.done
                        ? "bg-success/10 text-success"
                        : "bg-background-alt text-foreground-subtle")
                    }
                  >
                    <item.icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">{item.label}</p>
                    <p className="text-xs text-foreground-subtle">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Sidebar column: Medical profile + AI Assistant preview */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldPlus size={17} className="text-teal-strong dark:text-teal" />
                Medical profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <p className="text-sm text-foreground-muted">Not available yet.</p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Blood type, allergies, and medication ship with the Medical Profile milestone.
                </p>
                <Button size="sm" variant="secondary" disabled className="mt-4 opacity-50">
                  Complete profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="gx-glow-teal pointer-events-none absolute inset-0" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles size={17} className="text-teal-strong dark:text-teal" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                GPT-4o mini, grounded in WHO / Red Cross / AHA protocols — with a voice mode
                for hands-free guidance.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-0">
              <Button size="sm" disabled className="w-full opacity-50">
                Try the AI Assistant
              </Button>
              <p className="mt-2 text-center text-xs text-foreground-subtle">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.05] p-4 text-sm text-foreground-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-info" />
        <p>
          This is Milestone 1: authentication and the dashboard shell, connected to a real
          Supabase project. Every widget above reflects real account data or an honest empty
          state — emergency recognition, verification, SOS, Campus Mode, and the rest of the
          GuardianX V3.0 specification arrive in the milestones that follow.
        </p>
      </div>
    </div>
  );
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function buildActivity(
  user: { created_at: string; email_confirmed_at?: string | null; last_sign_in_at?: string | null },
  profileCreatedAt?: string
) {
  const format = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const items: { label: string; detail: string; icon: LucideIcon; done: boolean }[] = [
    {
      label: "Account created",
      detail: format(profileCreatedAt ?? user.created_at),
      icon: UserPlus,
      done: true,
    },
    {
      label: user.email_confirmed_at ? "Email confirmed" : "Email confirmation pending",
      detail: user.email_confirmed_at
        ? format(user.email_confirmed_at)
        : "Check your inbox for the confirmation link",
      icon: MailCheck,
      done: Boolean(user.email_confirmed_at),
    },
  ];

  if (user.last_sign_in_at) {
    items.push({
      label: "Last signed in",
      detail: format(user.last_sign_in_at),
      icon: LogIn,
      done: true,
    });
  } else {
    items.push({
      label: "First sign-in not yet recorded",
      detail: "This updates the next time you sign in",
      icon: Clock3,
      done: false,
    });
  }

  return items;
}

function QuickAction({
  icon: Icon,
  label,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  accent: "critical" | "teal";
}) {
  return (
    <div className="flex cursor-not-allowed flex-col items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 opacity-60">
      <span
        className={
          "flex h-9 w-9 items-center justify-center rounded-lg " +
          (accent === "critical" ? "bg-critical/10 text-critical" : "bg-teal/10 text-teal-strong dark:text-teal")
        }
      >
        <Icon size={16} />
      </span>
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Badge variant="neutral" className="px-2 py-0.5 text-[10px]">
          Soon
        </Badge>
      </div>
    </div>
  );
}