import type { Severity } from "@/types/supabase";
import type { EmergencyType } from "@/lib/ai/first-aid-protocols";

/**
 * Simulated AI Emergency Detection service.
 *
 * `detectEmergency()` is the ONLY function the rest of the app calls.
 * Its signature (async, takes a `DetectionInput`, returns a
 * `DetectionResult`) is written the way a real call to a vision/LLM API
 * would look — swapping the body of this function for a real GPT-4o
 * mini / Vision AI request later requires no change to any caller.
 *
 * The simulation is intentionally deterministic (keyword matching for
 * text, a filename hash for images) rather than random, so the same
 * input always produces the same result — closer to how a real model
 * behaves than a coin flip would be, and far easier to demo reliably.
 */

export interface DetectionInput {
  inputType: "image" | "text";
  text?: string;
  imageFileName?: string;
}

export interface DetectionResult {
  emergencyType: EmergencyType;
  label: string;
  severity: Severity;
  confidence: number;
  evidence: string[];
  reason: string;
  inputSummary: string;
}

interface EmergencyProfile {
  type: EmergencyType;
  label: string;
  severity: Severity;
  baseConfidence: number;
  keywords: string[];
  evidence: string[];
}

const PROFILES: EmergencyProfile[] = [
  {
    type: "stroke",
    label: "Stroke",
    severity: "critical",
    baseConfidence: 90,
    keywords: [
      "face droop", "drooping", "slurred", "slur", "arm weak", "numb",
      "confusion", "confused", "difficulty speaking", "one side", "stroke",
    ],
    evidence: [
      "Face drooping on one side",
      "Slurred or difficult speech",
      "Arm weakness or numbness",
      "Sudden confusion",
    ],
  },
  {
    type: "severe_bleeding",
    label: "Severe Bleeding",
    severity: "critical",
    baseConfidence: 85,
    keywords: ["bleeding", "blood", "cut", "wound", "hemorrhage", "gash"],
    evidence: [
      "Visible active bleeding",
      "Blood pooling or soaking through cloth",
      "Pale or clammy skin",
    ],
  },
  {
    type: "choking",
    label: "Choking",
    severity: "high",
    baseConfidence: 82,
    keywords: ["choking", "can't breathe", "cant breathe", "throat", "swallowed", "coughing hard"],
    evidence: [
      "Unable to speak or cough effectively",
      "Clutching throat",
      "Bluish lips or face",
    ],
  },
  {
    type: "allergic_reaction",
    label: "Allergic Reaction",
    severity: "high",
    baseConfidence: 80,
    keywords: [
      "allergic", "swelling", "hives", "rash", "anaphylaxis", "bee sting",
      "peanut", "reaction",
    ],
    evidence: [
      "Rapid swelling of face or throat",
      "Hives or widespread rash",
      "Difficulty breathing after exposure",
    ],
  },
  {
    type: "fracture",
    label: "Suspected Fracture",
    severity: "medium",
    baseConfidence: 75,
    keywords: [
      "fracture", "broken bone", "broke", "fell", "snapped", "can't move",
      "cant move", "deformity", "twisted",
    ],
    evidence: [
      "Visible deformity or swelling",
      "Inability to move or bear weight",
      "Pain at the injury site",
    ],
  },
];

const UNCLEAR_LABEL = "Unclear Emergency";

/** Small deterministic string hash (djb2) — used to pick an image-based result. */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

function jitter(seed: number, spread = 6): number {
  // Deterministic +/- spread based on the seed, so results feel like a
  // real model's varying confidence rather than a fixed constant.
  return (seed % (spread * 2 + 1)) - spread;
}

function detectFromText(text: string): { profile: EmergencyProfile | null; matchScore: number } {
  const lower = text.toLowerCase();
  let best: EmergencyProfile | null = null;
  let bestScore = 0;

  for (const profile of PROFILES) {
    const score = profile.keywords.reduce(
      (count, kw) => (lower.includes(kw) ? count + 1 : count),
      0
    );
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }

  return { profile: best, matchScore: bestScore };
}

function detectFromImageName(fileName: string): EmergencyProfile | null {
  const hash = hashString(fileName.toLowerCase());
  // One extra bucket beyond PROFILES.length so some images deliberately
  // land on "unclear" — a real vision model won't always be confident either.
  const bucket = hash % (PROFILES.length + 1);
  return bucket < PROFILES.length ? PROFILES[bucket] : null;
}

function buildReason(profile: EmergencyProfile | null, inputType: "image" | "text"): string {
  if (!profile) {
    return inputType === "text"
      ? "No distinguishing signs could be reliably matched in the description provided."
      : "No distinguishing signs could be reliably matched in the uploaded image.";
  }
  const source = inputType === "text" ? "the description provided" : "the uploaded image";
  return `${profile.evidence.length} indicators consistent with ${profile.label} were detected in ${source}.`;
}

/**
 * Runs (simulated) AI emergency detection. Replace the body of this
 * function with a real API call later — the signature stays the same.
 */
export async function detectEmergency(input: DetectionInput): Promise<DetectionResult> {
  // Simulated processing delay, so the "Analyzing" step in the UI behaves
  // the way it will once this is a real network call.
  await new Promise((resolve) => setTimeout(resolve, 900));

  let profile: EmergencyProfile | null = null;
  let inputSummary: string;
  let confidenceSeed: number;

  if (input.inputType === "text") {
    const text = (input.text ?? "").trim();
    const { profile: matched, matchScore } = detectFromText(text);
    profile = matchScore > 0 ? matched : null;
    inputSummary = text.length > 300 ? `${text.slice(0, 300)}…` : text;
    confidenceSeed = hashString(text) + matchScore * 4;
  } else {
    const fileName = input.imageFileName ?? "uploaded-image";
    profile = detectFromImageName(fileName);
    inputSummary = `Uploaded image: ${fileName}`;
    confidenceSeed = hashString(fileName);
  }

  if (!profile) {
    return {
      emergencyType: "unclear",
      label: UNCLEAR_LABEL,
      severity: "low",
      confidence: Math.max(20, 35 + jitter(confidenceSeed, 8)),
      evidence: [],
      reason: buildReason(null, input.inputType),
      inputSummary,
    };
  }

  const confidence = Math.min(97, Math.max(55, profile.baseConfidence + jitter(confidenceSeed)));

  return {
    emergencyType: profile.type,
    label: profile.label,
    severity: profile.severity,
    confidence,
    evidence: profile.evidence,
    reason: buildReason(profile, input.inputType),
    inputSummary,
  };
}

/**
 * Verification Layer: confirmed evidence raises confidence toward the
 * original AI estimate, denied evidence lowers it — a lightweight stand-in
 * for the spec's full Verification Layer (Section 6), scoped to what a
 * simulated detector can meaningfully support.
 */
export function computeVerifiedConfidence(
  baseConfidence: number,
  responses: Record<string, boolean>
): number {
  const values = Object.values(responses);
  if (values.length === 0) return baseConfidence;

  const confirmedCount = values.filter(Boolean).length;
  const ratio = confirmedCount / values.length;
  const adjusted = baseConfidence * ratio;

  return Math.round(Math.max(5, Math.min(99, adjusted)) * 100) / 100;
}