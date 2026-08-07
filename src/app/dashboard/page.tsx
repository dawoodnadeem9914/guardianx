import Link from "next/link";
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
  Users,
  CheckCircle2,
  ArrowRight,
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

  const [{ data: profile }, { data: medicalProfile }, { count: contactsCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", user.id).single(),
    supabase.from("medical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("emergency_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = timeOfDayGreeting();
  const activity = buildActivity(user, profile?.created_at);
  const contactCount = contactsCount ?? 0;

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
          <QuickAction
            icon={ShieldPlus}
            label="Medical profile"
            accent="teal"
            href="/dashboard/medical-profile"
            badgeText={medicalProfile ? "Complete" : "Add now"}
            badgeVariant={medicalProfile ? "low" : "neutral"}
          />
          <QuickAction
            icon={Users}
            label="Emergency contacts"
            accent="teal"
            href="/dashboard/contacts"
            badgeText={`${contactCount} saved`}
            badgeVariant={contactCount > 0 ? "low" : "neutral"}
          />
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

        {/* Sidebar column: Medical profile status + AI Assistant preview */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldPlus size={17} className="text-teal-strong dark:text-teal" />
                Medical profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {medicalProfile ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/[0.06] px-3.5 py-3">
                    <CheckCircle2 size={16} className="shrink-0 text-success" />
                    <p className="text-sm font-medium text-foreground">
                      Medical Profile Complete
                    </p>
                  </div>
                  <p className="text-xs text-foreground-subtle">
                    Blood type: {medicalProfile.blood_type ?? "Not set"} · Organ donor:{" "}
                    {medicalProfile.organ_donor ? "Yes" : "No"}
                  </p>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href="/dashboard/medical-profile">
                      View profile
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">Complete Profile</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    Blood type, allergies, and medications — visible to responders during an
                    active, verified incident.
                  </p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/dashboard/medical-profile">Complete profile</Link>
                  </Button>
                </div>
              )}
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
          Milestone 2 is live: Medical Profile and Emergency Contacts are fully connected to
          Supabase — everything above reflects real account data. Emergency recognition,
          verification, SOS, Campus Mode, and the rest of the GuardianX V3.0 specification
          arrive in the milestones that follow.
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
  href,
  badgeText,
  badgeVariant,
}: {
  icon: LucideIcon;
  label: string;
  accent: "critical" | "teal";
  href?: string;
  badgeText?: string;
  badgeVariant?: "low" | "neutral";
}) {
  const iconWrap = (
    <span
      className={
        "flex h-9 w-9 items-center justify-center rounded-lg " +
        (accent === "critical" ? "bg-critical/10 text-critical" : "bg-teal/10 text-teal-strong dark:text-teal")
      }
    >
      <Icon size={16} />
    </span>
  );

  const badge = (
    <Badge variant={badgeVariant ?? "neutral"} className="px-2 py-0.5 text-[10px]">
      {badgeText ?? "Soon"}
    </Badge>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="gx-hover-lift flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-raised p-4"
      >
        {iconWrap}
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {badge}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex cursor-not-allowed flex-col items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 opacity-60">
      {iconWrap}
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {badge}
      </div>
    </div>
  );
}