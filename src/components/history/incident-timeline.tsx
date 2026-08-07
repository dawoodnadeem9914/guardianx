import { CheckCircle2, Circle, Building2, Flag, type LucideIcon } from "lucide-react";
import { getSosStatusMeta, getSosStatusIndex } from "@/lib/sos/status-service";
import { SOS_STATUS_SEQUENCE, type SosStatus } from "@/lib/sos/send-sos";
import type { Severity } from "@/types/supabase";
import type { TimelineStep } from "@/lib/report/guardian-report";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * Reusable Emergency Replay / incident lifecycle view. Used by the
 * Incident History detail page, and reusable anywhere else a full
 * replay is useful later (e.g. a future Hospital Dashboard deep-dive).
 * Deliberately has no "use client" — it's pure presentation with no
 * interactivity, so it can be rendered directly from a Server Component
 * page, same pattern as `sos-status-card.tsx`.
 */

export interface IncidentTimelineDetection {
  label: string;
  severity: Severity;
  confidence: number;
  verifiedConfidence: number | null;
  evidence: string[];
  verificationResponses: Record<string, boolean> | null;
  createdAt: string;
}

export interface IncidentTimelineSos {
  status: SosStatus | "cancelled";
  assignedHospital: string | null;
  updatedAt: string;
}

export interface IncidentTimelineProps {
  detection: IncidentTimelineDetection;
  sos: IncidentTimelineSos | null;
  guidanceTimeline: TimelineStep[];
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

export function IncidentTimeline({ detection, sos, guidanceTimeline }: IncidentTimelineProps) {
  const confirmedCount = detection.evidence.filter(
    (item) => detection.verificationResponses?.[item]
  ).length;
  const deniedCount = detection.evidence.filter(
    (item) => detection.verificationResponses && !detection.verificationResponses[item]
  ).length;
  const wasVerified = detection.evidence.length > 0 && detection.verificationResponses != null;

  const sosStageIndex = sos ? getSosStatusIndex(sos.status) : -1;
  const isCompleted = sos !== null && sos.status === "completed";

  return (
    <div className="flex flex-col gap-6">
      {/* Stage-by-stage lifecycle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="flex flex-col gap-0">
            <TimelineNode
              icon={CheckCircle2}
              done
              title="Detection"
              subtitle={`${detection.label} · ${(detection.verifiedConfidence ?? detection.confidence).toFixed(0)}% confidence`}
              timestamp={formatTimestamp(detection.createdAt)}
            />
            <TimelineNode
              icon={wasVerified ? CheckCircle2 : Circle}
              done={wasVerified}
              title="Verification"
              subtitle={
                wasVerified
                  ? `${confirmedCount} confirmed, ${deniedCount} denied`
                  : "No specific evidence to verify"
              }
            />
            {sos ? (
              SOS_STATUS_SEQUENCE.map((stage, i) => {
                const meta = getSosStatusMeta(stage);
                const reached = sosStageIndex >= i;
                return (
                  <TimelineNode
                    key={stage}
                    icon={reached ? CheckCircle2 : Circle}
                    done={reached}
                    current={sosStageIndex === i}
                    title={meta.label}
                    subtitle={meta.description}
                  />
                );
              })
            ) : (
              <TimelineNode
                icon={Circle}
                done={false}
                title="SOS"
                subtitle="No SOS was sent for this incident"
              />
            )}
            <TimelineNode
              icon={sos?.assignedHospital ? Building2 : Circle}
              done={Boolean(sos?.assignedHospital)}
              title="Hospital"
              subtitle={sos?.assignedHospital ?? "Not yet assigned"}
            />
            <TimelineNode
              icon={isCompleted ? Flag : Circle}
              done={isCompleted}
              last
              title="Completion"
              subtitle={sos && isCompleted ? `Completed ${formatTimestamp(sos.updatedAt)}` : "Not yet completed"}
            />
          </ol>
        </CardContent>
      </Card>

      {/* Guidance timeline — the Now/30s/1min/5min/Until Help Arrives content, a distinct concept from the lifecycle above */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guidance timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="flex flex-col gap-3">
            {guidanceTimeline.map((step) => (
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
    </div>
  );
}

function TimelineNode({
  icon: Icon,
  done,
  current = false,
  last = false,
  title,
  subtitle,
  timestamp,
}: {
  icon: LucideIcon;
  done: boolean;
  current?: boolean;
  last?: boolean;
  title: string;
  subtitle: string;
  timestamp?: string;
}) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className={
            "absolute left-[11px] top-6 h-full w-px " +
            (done ? "bg-teal-strong dark:bg-teal" : "bg-border")
          }
        />
      )}
      <span
        className={
          "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full " +
          (done
            ? "bg-teal-strong text-white dark:bg-teal dark:text-[#04201c]"
            : current
              ? "border-2 border-teal-strong text-teal-strong dark:border-teal dark:text-teal"
              : "border-2 border-border text-foreground-subtle")
        }
      >
        <Icon size={13} />
      </span>
      <div className="flex-1 pt-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={
              "text-sm font-medium " + (done || current ? "text-foreground" : "text-foreground-subtle")
            }
          >
            {title}
          </p>
          {timestamp && <span className="text-xs text-foreground-subtle">{timestamp}</span>}
        </div>
        <p className="text-xs text-foreground-subtle">{subtitle}</p>
      </div>
    </li>
  );
}