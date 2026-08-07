"use client";

import { Phone, Clock } from "lucide-react";
import type { Severity } from "@/types/supabase";
import { LogoMark } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuardianCardDetection {
  label: string;
  severity: Severity;
  confidence: number;
  detectedAt: string;
}

interface GuardianCardContact {
  name: string;
  relationship: string | null;
  phone: string;
}

export interface GuardianCardClientProps {
  patientName: string;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  emergencyContact: GuardianCardContact | null;
  detection: GuardianCardDetection | null;
  hasMedicalProfile: boolean;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
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

/**
 * Deliberately a Client Component (not a Server Component) even though
 * nothing here is interactive yet — this is what makes it a one-file
 * change to add a QR code, a "Download" button, or a `window.print()`
 * call later, without restructuring the page/component boundary.
 */
export function GuardianCardClient({
  patientName,
  dateOfBirth,
  bloodType,
  allergies,
  conditions,
  medications,
  emergencyContact,
  detection,
  hasMedicalProfile,
}: GuardianCardClientProps) {
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  return (
    <Card className="overflow-hidden p-0">
      {/* Top band — emergency type + severity carry the most visual weight */}
      <div className="border-b border-border bg-background-alt px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-sm font-semibold tracking-tight text-foreground">GuardianX</span>
          </div>
          {detection ? (
            <Badge variant={detection.severity} className="px-4 py-1.5 text-sm capitalize">
              {detection.severity}
            </Badge>
          ) : (
            <Badge variant="neutral">No emergency on record</Badge>
          )}
        </div>
        {detection && (
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {detection.label}
          </h2>
        )}
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
        {/* Patient identity — biggest, fastest-to-read block on the card */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
            Patient
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {patientName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatBlock label="Age" value={age !== null ? String(age) : "Unknown"} />
          <StatBlock label="Blood type" value={bloodType ?? "Unknown"} accent />
          {detection && (
            <StatBlock label="Confidence" value={`${detection.confidence.toFixed(0)}%`} />
          )}
        </div>

        {!hasMedicalProfile ? (
          <p className="text-sm text-foreground-muted">
            No medical profile on file — allergies, conditions, and medications aren&apos;t
            available yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <TextBlock label="Allergies" value={allergies} />
            <TextBlock label="Medical conditions" value={conditions} />
            <TextBlock label="Current medications" value={medications} />
          </div>
        )}

        {/* Bottom band — emergency contact, what a responder needs fastest */}
        <div className="rounded-xl border border-teal/25 bg-teal/[0.05] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
            Emergency contact
          </p>
          {emergencyContact ? (
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold text-foreground">
                {emergencyContact.name}
                {emergencyContact.relationship && (
                  <span className="ml-1.5 text-sm font-normal text-foreground-muted">
                    ({emergencyContact.relationship})
                  </span>
                )}
              </p>
              <p className="flex items-center gap-1.5 text-lg font-semibold text-teal-strong dark:text-teal">
                <Phone size={16} />
                {emergencyContact.phone}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-foreground-muted">No emergency contact saved.</p>
          )}
        </div>

        {detection && (
          <p className="flex items-center gap-1.5 text-xs text-foreground-subtle">
            <Clock size={12} />
            Detected {formatTimestamp(detection.detectedAt)}
          </p>
        )}
      </div>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">{label}</p>
      <p
        className={
          "mt-1 text-xl font-semibold " +
          (accent ? "text-teal-strong dark:text-teal" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || "None recorded"}</p>
    </div>
  );
}