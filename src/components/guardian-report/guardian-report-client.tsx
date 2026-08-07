"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle, Loader2, RefreshCw, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  EmergencyDetection,
  MedicalProfile,
  EmergencyContact,
  SosRequest,
  EmergencyReport,
} from "@/types/supabase";
import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import { getEmergencyTimeline } from "@/lib/report/emergency-timeline";
import { buildGuardianReport } from "@/lib/report/guardian-report";
import { getSosStatusMeta } from "@/lib/sos/status-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GuardianReportClientProps {
  userId: string;
  initialReport: EmergencyReport | null;
  latestDetection: EmergencyDetection | null;
  medicalProfile: MedicalProfile | null;
  topContact: EmergencyContact | null;
  latestSosRequest: SosRequest | null;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function GuardianReportClient({
  userId,
  initialReport,
  latestDetection,
  medicalProfile,
  topContact,
  latestSosRequest,
}: GuardianReportClientProps) {
  const router = useRouter();
  const [report, setReport] = React.useState(initialReport);
  const [generating, setGenerating] = React.useState(false);

  async function handleGenerate() {
    if (!latestDetection) {
      toast.error("Run AI Emergency Detection first — a report needs an incident to summarize.");
      return;
    }
    setGenerating(true);

    const emergencyType = latestDetection.emergency_type as EmergencyType;
    const protocol = getFirstAidProtocol(emergencyType);
    const timeline = getEmergencyTimeline(emergencyType);
    const sosStatusLabel = latestSosRequest
      ? getSosStatusMeta(latestSosRequest.status).label
      : "No SOS sent yet";

    const reportData = buildGuardianReport({
      detection: {
        emergencyType: latestDetection.emergency_type,
        label: protocol.label,
        inputType: latestDetection.input_type,
        inputSummary: latestDetection.input_summary,
        detectedAt: latestDetection.created_at,
        confidence: latestDetection.confidence,
        verifiedConfidence: latestDetection.verified_confidence,
        evidence: latestDetection.evidence,
        verificationResponses: latestDetection.verification_responses,
        reason: latestDetection.reason,
        severity: latestDetection.severity,
      },
      firstAid: { protocolLabel: protocol.label, steps: protocol.steps },
      medicalProfile: medicalProfile
        ? {
            fullName: medicalProfile.full_name,
            bloodType: medicalProfile.blood_type,
            allergies: medicalProfile.allergies,
            medications: medicalProfile.medications,
            conditions: medicalProfile.conditions,
            organDonor: medicalProfile.organ_donor,
          }
        : null,
      emergencyContact: topContact
        ? { name: topContact.name, relationship: topContact.relationship, phone: topContact.phone }
        : null,
      timeline,
      sosStatusLabel,
    });

    const supabase = createClient();
    const { data, error } = await supabase
      .from("emergency_reports")
      .insert({
        id: reportData.reportId,
        user_id: userId,
        detection_id: latestDetection.id,
        sos_request_id: latestSosRequest?.id ?? null,
        status: latestSosRequest ? latestSosRequest.status : "not_applicable",
        report_data: reportData,
      })
      .select()
      .single();

    setGenerating(false);

    if (error || !data) {
      toast.error(error?.message || "Couldn't generate the report. Please try again.");
      return;
    }

    setReport(data);
    toast.success("Guardian Report generated.");
    router.refresh();
  }

  if (!report) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
          <FileText size={22} />
        </span>
        <div>
          <p className="font-medium text-foreground">No report generated yet</p>
          <p className="mt-1 text-sm text-foreground-muted">
            {latestDetection
              ? "Generate a Guardian Report summarizing your latest detection, first aid, and current status."
              : "Run AI Emergency Detection first — a report needs an incident to summarize."}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating || !latestDetection}>
          {generating && <Loader2 size={16} className="animate-spin" />}
          {generating ? "Generating…" : "Generate Guardian Report"}
        </Button>
      </Card>
    );
  }

  const data = report.report_data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-foreground-subtle">Report ID</p>
          <p className="font-mono text-xs text-foreground-muted">{report.id}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleGenerate}
          disabled={generating || !latestDetection}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {generating ? "Generating…" : "Generate new report"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground-muted">{data.incidentSummary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={data.detection.severity}>{data.detection.severity}</Badge>
            <Badge variant="neutral">
              {(data.detection.verifiedConfidence ?? data.detection.confidence).toFixed(0)}%
              confidence
            </Badge>
            <Badge variant="teal">{data.currentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detection &amp; verification</CardTitle>
          <CardDescription>{data.detection.reason ?? "No reasoning recorded."}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="flex flex-col gap-1.5">
            {data.verification.confirmedEvidence.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 size={14} className="shrink-0 text-success" />
                {item}
              </li>
            ))}
            {data.verification.deniedEvidence.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-foreground-subtle line-through"
              >
                <XCircle size={14} className="shrink-0 text-foreground-subtle" />
                {item}
              </li>
            ))}
            {!data.verification.verified && (
              <li className="text-sm text-foreground-muted">No specific evidence was identified.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            First aid summary: {data.firstAidSummary.protocolLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="flex flex-col gap-2">
            {data.firstAidSummary.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground-muted">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[11px] font-semibold text-teal-strong dark:text-teal">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="flex flex-col gap-3">
            {data.timeline.map((step) => (
              <li key={step.label} className="flex gap-3">
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  {step.label}
                </span>
                <span className="text-sm text-foreground-muted">{step.instruction}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medical profile summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            {data.medicalProfileSummary.available ? (
              <dl className="flex flex-col gap-1.5">
                <SummaryRow label="Blood type" value={data.medicalProfileSummary.bloodType ?? "Unknown"} />
                <SummaryRow
                  label="Allergies"
                  value={data.medicalProfileSummary.allergies || "None recorded"}
                />
                <SummaryRow
                  label="Conditions"
                  value={data.medicalProfileSummary.conditions || "None recorded"}
                />
                <SummaryRow
                  label="Organ donor"
                  value={data.medicalProfileSummary.organDonor ? "Yes" : "No"}
                />
              </dl>
            ) : (
              <p className="text-foreground-muted">No medical profile on file.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency contact</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            {data.emergencyContactSummary.available ? (
              <dl className="flex flex-col gap-1.5">
                <SummaryRow label="Name" value={data.emergencyContactSummary.name ?? "—"} />
                <SummaryRow
                  label="Relationship"
                  value={data.emergencyContactSummary.relationship || "—"}
                />
                <SummaryRow label="Phone" value={data.emergencyContactSummary.phone ?? "—"} />
              </dl>
            ) : (
              <p className="text-foreground-muted">No emergency contact on file.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.05] p-4 text-sm text-foreground-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-info" />
        <p>
          Generated {formatTimestamp(report.created_at)}. This report is a snapshot — generating a
          new one creates a fresh record rather than editing this one. PDF export isn&apos;t built
          yet; this structured data is exactly what a future exporter will read from.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1 last:border-0">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}