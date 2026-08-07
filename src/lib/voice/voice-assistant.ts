import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";

/**
 * Simulated Voice Assistant service.
 *
 * `runVoiceTurn()` is the ONLY function a caller needs. Its shape (async,
 * takes the running conversation context, returns one grounded reply) is
 * how a real Whisper transcription + GPT-4o mini response loop would
 * work too — swapping the body for real STT/LLM calls later requires no
 * change to any caller. No real speech recognition happens here; the
 * "voice interface" (voice-assistant-client.tsx) simulates listening
 * with a mic icon and passes typed/simulated text into this function.
 *
 * Every reply is grounded in `first-aid-protocols.ts`, never invented —
 * the same principle every other simulated AI service in this project
 * follows (`detect-emergency.ts`, `safety-layer.ts`).
 */

export interface VoiceMessage {
  role: "user" | "assistant";
  text: string;
}

export interface VoiceTurnInput {
  message: string;
  /** Context from an active detection/SOS, if any — null means no emergency is on record. */
  emergencyType: EmergencyType | null;
  /** How many first-aid steps have already been given in this conversation. */
  stepsGiven: number;
}

export interface VoiceTurnResult {
  reply: string;
  /** Updated steps-given count, so the caller can track progression across turns. */
  stepsGiven: number;
  groundedIn: "first_aid_protocol" | "safety_notice" | "general";
}

const NEXT_STEP_KEYWORDS = ["next", "what do i do", "what now", "then what", "step"];
const EMERGENCY_CALL_KEYWORDS = ["call", "ambulance", "emergency number", "911", "999"];
const BREATHING_KEYWORDS = ["breathing", "breathe", "conscious", "responsive"];

export async function runVoiceTurn(input: VoiceTurnInput): Promise<VoiceTurnResult> {
  // Simulated processing delay, so the UI behaves the way it will once
  // this is backed by a real STT + LLM round trip.
  await new Promise((resolve) => setTimeout(resolve, 700));

  const lower = input.message.toLowerCase();

  if (!input.emergencyType) {
    return {
      reply:
        "I don't have an active emergency to guide you through yet. Run AI Emergency Detection first, then come back and I can walk you through it step by step.",
      stepsGiven: input.stepsGiven,
      groundedIn: "general",
    };
  }

  const protocol = getFirstAidProtocol(input.emergencyType);

  if (EMERGENCY_CALL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      reply:
        "Yes — call your local emergency number now if you haven't already. I'll keep guiding you while you wait.",
      stepsGiven: input.stepsGiven,
      groundedIn: "safety_notice",
    };
  }

  if (BREATHING_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      reply: `Check if they're responsive and breathing normally. ${protocol.steps[0]}`,
      stepsGiven: input.stepsGiven,
      groundedIn: "first_aid_protocol",
    };
  }

  if (NEXT_STEP_KEYWORDS.some((kw) => lower.includes(kw)) || input.stepsGiven === 0) {
    const stepIndex = Math.min(input.stepsGiven, protocol.steps.length - 1);
    const isLastStep = stepIndex === protocol.steps.length - 1;
    return {
      reply: isLastStep
        ? `${protocol.steps[stepIndex]} That's the last step — keep going until help arrives.`
        : protocol.steps[stepIndex],
      stepsGiven: Math.min(input.stepsGiven + 1, protocol.steps.length),
      groundedIn: "first_aid_protocol",
    };
  }

  return {
    reply:
      'I can only guide you using verified first-aid steps. Try asking "what do I do next", or tell me if they\'re breathing.',
    stepsGiven: input.stepsGiven,
    groundedIn: "general",
  };
}