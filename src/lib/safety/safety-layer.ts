/**
 * Simulated AI Safety Layer.
 *
 * `evaluateSafetyLayer()` is a pure function: given the current state of
 * a user's account (latest detection confidence/type, whether they have
 * a contact and medical profile saved), it returns the warnings/
 * recommendations they should see. No Supabase calls here — the caller
 * gathers the input and this function only reasons about it, matching
 * every other simulated service in this project (`detect-emergency.ts`,
 * `guardian-report.ts`).
 */

export type SafetyWarningLevel = "info" | "warning" | "critical";

export interface SafetyWarning {
  id: string;
  level: SafetyWarningLevel;
  title: string;
  message: string;
}

export interface SafetyLayerInput {
  /** Confidence (verified if available, else raw) of the latest detection. Null if no detection exists yet. */
  confidence: number | null;
  /** Emergency type of the latest detection, e.g. "unclear" or null if none exists yet. */
  emergencyType: string | null;
  hasEmergencyContact: boolean;
  hasMedicalProfile: boolean;
}

const LOW_CONFIDENCE_THRESHOLD = 50;

export function evaluateSafetyLayer(input: SafetyLayerInput): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  if (input.confidence !== null && input.confidence < LOW_CONFIDENCE_THRESHOLD) {
    warnings.push({
      id: "low-confidence",
      level: "warning",
      title: "Low confidence detection",
      message:
        "GuardianX isn't highly confident in this result. Verify symptoms manually, and call your local emergency number if you're unsure.",
    });
  }

  if (input.emergencyType === "unclear") {
    warnings.push({
      id: "unknown-emergency",
      level: "critical",
      title: "Unclear emergency",
      message:
        "GuardianX couldn't confidently identify a specific emergency. Follow general safety advice: call for help, stay calm, and don't attempt unverified treatment.",
    });
  }

  if (!input.hasEmergencyContact) {
    warnings.push({
      id: "no-contact",
      level: "critical",
      title: "No emergency contact saved",
      message: "You don't have an emergency contact on file yet, so an SOS has no one to notify.",
    });
  }

  if (!input.hasMedicalProfile) {
    warnings.push({
      id: "no-medical-profile",
      level: "info",
      title: "Medical profile incomplete",
      message: "Adding your medical profile helps responders act faster once they arrive.",
    });
  }

  return warnings;
}

export function hasCriticalSafetyWarnings(warnings: SafetyWarning[]): boolean {
  return warnings.some((w) => w.level === "critical");
}