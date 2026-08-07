import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { getEmergencyTimeline } from "@/lib/report/emergency-timeline";
import { IncidentTimeline } from "@/components/history/incident-timeline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Incident Replay" };

export default async function IncidentReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/history/${id}`);

  const { data: detection } = await supabase
    .from("emergency_detections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Scoping the query to user_id already prevents cross-account access at
  // the RLS layer, but a missing/foreign id still needs a real 404 rather
  // than crashing on `detection.emergency_type` below.
  if (!detection) notFound();

  const { data: sos } = await supabase
    .from("sos_requests")
    .select("*")
    .eq("detection_id", detection.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const protocol = getFirstAidProtocol(detection.emergency_type as EmergencyType);
  const guidanceTimeline = getEmergencyTimeline(detection.emergency_type as EmergencyType);
  const confidence = detection.verified_confidence ?? detection.confidence;

  const confirmedEvidence = detection.evidence.filter(
    (item) => detection.verification_responses?.[item]
  );
  const deniedEvidence = detection.evidence.filter(
    (item) => detection.verification_responses && !detection.verification_responses[item]
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to history
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {protocol.label}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={detection.severity}>{detection.severity}</Badge>
            <Badge variant="neutral">{confidence.toFixed(0)}% confidence</Badge>
          </div>
        </div>
        <p className="mt-1 text-sm text-foreground-muted">
          Detected{" "}
          {new Date(detection.created_at).toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {detection.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence &amp; reasoning</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <ul className="flex flex-col gap-1.5">
              {confirmedEvidence.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                  {item}
                </li>
              ))}
              {deniedEvidence.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-foreground-subtle line-through"
                >
                  <XCircle size={14} className="shrink-0 text-foreground-subtle" />
                  {item}
                </li>
              ))}
            </ul>
            {detection.reason && (
              <p className="text-sm text-foreground-muted">{detection.reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      <IncidentTimeline
        detection={{
          label: protocol.label,
          severity: detection.severity,
          confidence: detection.confidence,
          verifiedConfidence: detection.verified_confidence,
          evidence: detection.evidence,
          verificationResponses: detection.verification_responses,
          createdAt: detection.created_at,
        }}
        sos={
          sos
            ? {
                status: sos.status,
                assignedHospital: sos.assigned_hospital,
                updatedAt: sos.updated_at,
              }
            : null
        }
        guidanceTimeline={guidanceTimeline}
      />
    </div>
  );
}