import { Phone, Clock, Building2 } from "lucide-react";
import { getSosStatusMeta } from "@/lib/sos/status-service";
import type { SosStatus } from "@/lib/sos/send-sos";
import type { Severity } from "@/types/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SosStatusCardContact {
  name: string;
  relationship: string | null;
  phone: string;
}

export interface SosStatusCardProps {
  status: SosStatus | "cancelled";
  emergencyLabel: string;
  severity: Severity;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  contact: SosStatusCardContact | null;
  /** Set once the simulated pipeline reaches "ambulance_en_route". */
  etaMinutes?: number | null;
  /** Set once the simulated pipeline reaches "hospital_assigned". */
  assignedHospital?: string | null;
  /** Tighter spacing/typography for use inside widgets (Dashboard, Family Updates, Hospital view). */
  compact?: boolean;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SosStatusCard({
  status,
  emergencyLabel,
  severity,
  confidence,
  createdAt,
  updatedAt,
  contact,
  etaMinutes,
  assignedHospital,
  compact = false,
}: SosStatusCardProps) {
  const meta = getSosStatusMeta(status);

  return (
    <Card className={compact ? "" : "p-6 sm:p-8"}>
      <CardHeader className={compact ? "p-0 pb-4" : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className={compact ? "text-base" : "text-xl"}>{meta.label}</CardTitle>
          <Badge variant={severity}>{severity}</Badge>
        </div>
        <p className="text-sm text-foreground-muted">{meta.description}</p>
      </CardHeader>

      <CardContent className={compact ? "flex flex-col gap-4 p-0" : "flex flex-col gap-5 pt-0"}>
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-background-alt">
            <div
              className="h-full rounded-full bg-teal-strong transition-all duration-500 dark:bg-teal"
              style={{ width: `${meta.progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-foreground-subtle">{meta.progress}% complete</p>
        </div>

        {(etaMinutes != null || assignedHospital) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {etaMinutes != null && (
              <div className="flex items-center gap-2.5 rounded-xl border border-teal/25 bg-teal/[0.05] px-3.5 py-3">
                <Clock size={16} className="shrink-0 text-teal-strong dark:text-teal" />
                <div>
                  <p className="text-xs text-foreground-subtle">Estimated arrival</p>
                  <p className="text-sm font-semibold text-foreground">
                    {etaMinutes === 0 ? "Arrived" : `${etaMinutes} min`}
                  </p>
                </div>
              </div>
            )}
            {assignedHospital && (
              <div className="flex items-center gap-2.5 rounded-xl border border-teal/25 bg-teal/[0.05] px-3.5 py-3">
                <Building2 size={16} className="shrink-0 text-teal-strong dark:text-teal" />
                <div>
                  <p className="text-xs text-foreground-subtle">Assigned hospital</p>
                  <p className="text-sm font-semibold text-foreground">{assignedHospital}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Row label="Emergency" value={emergencyLabel} />
          <Row label="Confidence" value={`${confidence.toFixed(0)}%`} />
          <Row label="Detected" value={formatTimestamp(createdAt)} />
          <Row
            label="Selected contact"
            value={contact ? `${contact.name}${contact.relationship ? ` · ${contact.relationship}` : ""}` : "None saved"}
          />
          {contact && (
            <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
              <span className="flex items-center gap-1.5 text-foreground-subtle">
                <Phone size={12} />
                Phone
              </span>
              <span className="font-medium text-foreground">{contact.phone}</span>
            </div>
          )}
          <Row label="Last updated" value={formatTimestamp(updatedAt)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <span className="text-foreground-subtle">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}