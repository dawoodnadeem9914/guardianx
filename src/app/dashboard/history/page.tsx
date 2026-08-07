import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, History as HistoryIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { getSosStatusMeta } from "@/lib/sos/status-service";
import type { SosStatus } from "@/lib/sos/send-sos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Incident History" };

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/history");

  const [{ data: detections }, { data: sosRequests }] = await Promise.all([
    supabase
      .from("emergency_detections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("sos_requests").select("detection_id, status").eq("user_id", user.id),
  ]);

  const sosStatusByDetectionId = new Map<string, SosStatus | "cancelled">();
  (sosRequests ?? []).forEach((sos) => {
    if (sos.detection_id) sosStatusByDetectionId.set(sos.detection_id, sos.status);
  });

  const incidents = detections ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Incident History
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Every AI Emergency Detection on your account, newest first.
        </p>
      </div>

      {incidents.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
            <HistoryIcon size={20} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No incidents yet</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Your detection history will appear here once you run AI Emergency Detection.
            </p>
          </div>
          <Button size="sm" className="mt-1" asChild>
            <Link href="/dashboard/emergency">Try AI Detection</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((incident) => {
            const protocol = getFirstAidProtocol(incident.emergency_type as EmergencyType);
            const confidence = incident.verified_confidence ?? incident.confidence;
            const sosStatus = sosStatusByDetectionId.get(incident.id);

            return (
              <Link key={incident.id} href={`/dashboard/history/${incident.id}`}>
                <Card className="gx-hover-lift p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-semibold text-teal-strong dark:text-teal">
                        {protocol.label.charAt(0)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{protocol.label}</p>
                        <p className="text-xs text-foreground-subtle">
                          {new Date(incident.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={incident.severity}>{incident.severity}</Badge>
                      <Badge variant="neutral">{confidence.toFixed(0)}%</Badge>
                      {sosStatus && <Badge variant="teal">{getSosStatusMeta(sosStatus).label}</Badge>}
                      <ArrowRight size={15} className="text-foreground-subtle" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}