import { redirect } from "next/navigation";
import { Activity, CheckCircle2, FileBarChart, Info, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computeCampusStats } from "@/lib/campus/campus-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Campus Dashboard" };

const SEVERITY_BAR_CLASS: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-[#f97316]",
  critical: "bg-critical",
};

export default async function CampusDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/campus-dashboard");

  const [{ data: detections }, { data: sosRequests }] = await Promise.all([
    supabase.from("emergency_detections").select("*").eq("user_id", user.id),
    supabase.from("sos_requests").select("*").eq("user_id", user.id),
  ]);

  const stats = computeCampusStats(detections ?? [], sosRequests ?? []);
  const maxSeverityCount = Math.max(1, ...stats.severityDistribution.map((s) => s.count));
  const maxCategoryCount = Math.max(1, ...stats.categoryDistribution.map((c) => c.count));
  const maxMonthlyCount = Math.max(1, ...stats.monthlyReports.map((m) => m.count));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Campus Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Incident statistics and reporting for administrators.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.05] p-4 text-sm text-foreground-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-info" />
        <p>
          These statistics reflect real data on your own account — GuardianX doesn&apos;t yet
          have multi-user campus roles, so this is an honest &quot;campus of one&quot; view rather
          than fabricated numbers, until real institutional deployment exists.
        </p>
      </div>

      {stats.totalIncidents === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
            <FileBarChart size={20} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No incidents recorded yet</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Statistics will appear here once you have detection or SOS history.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Top-line stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={FileBarChart} label="Total incidents" value={stats.totalIncidents} />
            <StatCard
              icon={Activity}
              label="Active emergencies"
              value={stats.activeEmergencies}
              accent="critical"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed emergencies"
              value={stats.completedEmergencies}
              accent="success"
            />
          </div>

          {/* Severity distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {stats.severityDistribution.map((item) => (
                <div key={item.severity} className="flex items-center gap-3">
                  <Badge variant={item.severity} className="w-20 shrink-0 justify-center capitalize">
                    {item.severity}
                  </Badge>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background-alt">
                    <div
                      className={`h-full rounded-full ${SEVERITY_BAR_CLASS[item.severity]}`}
                      style={{ width: `${(item.count / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emergency categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {stats.categoryDistribution.map((item) => (
                <div key={item.emergencyType} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm text-foreground-muted">
                    {item.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background-alt">
                    <div
                      className="h-full rounded-full bg-teal-strong dark:bg-teal"
                      style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex h-40 items-end gap-3">
                {stats.monthlyReports.map((month) => (
                  <div key={month.monthKey} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-teal-strong transition-all duration-500 dark:bg-teal"
                        style={{
                          height: `${Math.max(4, (month.count / maxMonthlyCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-foreground-subtle">{month.monthLabel}</span>
                    <span className="text-xs font-medium text-foreground">{month.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: "teal" | "critical" | "success";
}) {
  const accentClass =
    accent === "critical"
      ? "bg-critical/10 text-critical"
      : accent === "success"
        ? "bg-success/10 text-success"
        : "bg-teal/10 text-teal-strong dark:text-teal";

  return (
    <Card className="p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accentClass}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
    </Card>
  );
}