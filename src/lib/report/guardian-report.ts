import type { Severity } from "@/types/supabase";

/**
 * A single step in an Emergency Timeline (Now / 30 Seconds / 1 Minute /
 * 5 Minutes / Until Help Arrives). Defined here — rather than in
 * `emergency-timeline.ts` — because the Guardian Report is the
 * structure that ultimately needs to describe this shape for storage
 * and future PDF export; `emergency-timeline.ts` imports it from here.
 */
export interface TimelineStep {
  label: string;
  instruction: string;
}

export interface GuardianReportInput {
  detection: {
    emergencyType: string;
    label: string;
    inputType: "image" | "text";
    inputSummary: string;
    detectedAt: string;
    confidence: number;
    verifiedConfidence: number | null;
    evidence: string[];
    verificationResponses: Record<string, boolean> | null;
    reason: string | null;
    severity: Severity;
  };
  firstAid: {
    protocolLabel: string;
    steps: string[];
  };
  medicalProfile: {
    fullName: string;
    bloodType: string | null;
    allergies: string | null;
    medications: string | null;
    conditions: string | null;
    organDonor: boolean;
  } | null;
  emergencyContact: {
    name: string;
    relationship: string | null;
    phone: string;
  } | null;
  timeline: TimelineStep[];
  /** Human-readable current SOS status, e.g. "Completed" or "No SOS sent yet". */
  sosStatusLabel: string;
}

export interface GuardianReportData {
  reportId: string;
  generatedAt: string;
  incidentSummary: string;
  detection: GuardianReportInput["detection"];
  verification: {
    confirmedEvidence: string[];
    deniedEvidence: string[];
    verified: boolean;
  };
  firstAidSummary: GuardianReportInput["firstAid"];

  medicalProfileSummary: { available: boolean } & Partial<
    NonNullable<GuardianReportInput["medicalProfile"]>
  >;

  emergencyContactSummary: { available: boolean } & Partial<
    NonNullable<GuardianReportInput["emergencyContact"]>
  >;

  timeline: TimelineStep[];
  currentStatus: string;
}

/**
 * Compiles a full Guardian Report from already-fetched data. Pure and
 * synchronous — no Supabase calls here, matching the pattern established
 * by `detect-emergency.ts`. The caller (a Client Component) is
 * responsible for gathering the input and persisting the result.
 *
 * `reportId` is generated here (not left to the database default) so
 * the same id can be used both as the row's primary key and as a
 * self-contained field inside `report_data` — useful once a future PDF
 * renderer needs to work from `report_data` alone.
 */
export function buildGuardianReport(input: GuardianReportInput): GuardianReportData {
  const evidence = input.detection.evidence;
  const responses = input.detection.verificationResponses ?? {};
  const confirmedEvidence = evidence.filter((item) => responses[item]);
  const deniedEvidence = evidence.filter((item) => !responses[item]);

  const confidenceToReport = input.detection.verifiedConfidence ?? input.detection.confidence;
  const incidentSummary = `${input.detection.label} detected via ${
    input.detection.inputType === "text" ? "symptom description" : "image upload"
  }, rated ${input.detection.severity} severity at ${confidenceToReport.toFixed(0)}% confidence.`;

  return {
    reportId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    incidentSummary,
    detection: input.detection,
    verification: {
      confirmedEvidence,
      deniedEvidence,
      verified: evidence.length > 0,
    },
    firstAidSummary: input.firstAid,
    medicalProfileSummary: input.medicalProfile
      ? { available: true, ...input.medicalProfile }
      : { available: false },
    emergencyContactSummary: input.emergencyContact
      ? { available: true, ...input.emergencyContact }
      : { available: false },
    timeline: input.timeline,
    currentStatus: input.sosStatusLabel,
  };
}