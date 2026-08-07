/**
 * Static first-aid knowledge base for Milestone 3.
 *
 * This is the file that gets replaced when GuardianX moves to a real
 * RAG-grounded knowledge base (WHO / Red Cross / AHA protocols, per the
 * V3.0 specification). Everything that consumes first-aid content reads
 * it through `getFirstAidProtocol()`, so that swap won't require any
 * caller to change.
 */

export type EmergencyType =
  | "stroke"
  | "severe_bleeding"
  | "choking"
  | "allergic_reaction"
  | "fracture"
  | "unclear";

export interface FirstAidProtocol {
  type: EmergencyType;
  label: string;
  steps: string[];
}

/** Shown alongside every first-aid result, regardless of emergency type. */
export const DISCLAIMER =
  "This guidance supplements, not replaces, professional emergency care. If you are ever in doubt, call your local emergency number immediately.";

export const firstAidProtocols: Record<EmergencyType, FirstAidProtocol> = {
  stroke: {
    type: "stroke",
    label: "Stroke",
    steps: [
      "Note the time symptoms started — this is critical information for responders.",
      "Call your local emergency number immediately.",
      "Keep the person calm and lying down with their head slightly raised.",
      "Do not give them food, water, or medication.",
      "Loosen tight clothing and monitor their breathing until help arrives.",
    ],
  },
  severe_bleeding: {
    type: "severe_bleeding",
    label: "Severe Bleeding",
    steps: [
      "Call your local emergency number immediately.",
      "Apply firm, direct pressure to the wound with a clean cloth or bandage.",
      "Do not remove the cloth if it soaks through — add more on top instead.",
      "Keep the injured area raised above heart level if possible.",
      "Keep the person still and warm while you wait for help.",
    ],
  },
  choking: {
    type: "choking",
    label: "Choking",
    steps: [
      "Ask if they can cough or speak — if yes, encourage coughing.",
      "If they cannot breathe, cough, or speak, give 5 firm back blows between the shoulder blades.",
      "Follow with 5 abdominal thrusts (Heimlich maneuver) if back blows don't clear it.",
      "Call your local emergency number if the obstruction doesn't clear quickly.",
      "Continue alternating back blows and abdominal thrusts until help arrives or it clears.",
    ],
  },
  allergic_reaction: {
    type: "allergic_reaction",
    label: "Allergic Reaction",
    steps: [
      "Call your local emergency number immediately if breathing is affected.",
      "Help them use an epinephrine auto-injector (e.g. an EpiPen) if they have one.",
      "Have them sit upright if breathing is difficult, or lie flat if they feel faint.",
      "Remove or avoid further exposure to the suspected trigger.",
      "Stay with them and be ready to begin CPR if they become unresponsive.",
    ],
  },
  fracture: {
    type: "fracture",
    label: "Suspected Fracture",
    steps: [
      "Keep the injured area still — do not try to realign or push a bone back in place.",
      "Support the area above and below the injury to limit movement.",
      "Apply a cold pack wrapped in cloth to reduce swelling, if available.",
      "Call your local emergency number for a suspected fracture that limits movement or breathing.",
      "Watch for signs of shock — pale skin, rapid breathing — while waiting for help.",
    ],
  },
  unclear: {
    type: "unclear",
    label: "Unclear Emergency",
    steps: [
      "Call your local emergency number immediately — do not wait for a clearer picture.",
      "Stay with the person and keep them as calm and comfortable as possible.",
      "Do not attempt specific medical treatment without guidance from a professional.",
    ],
  },
};

export function getFirstAidProtocol(type: EmergencyType): FirstAidProtocol {
  return firstAidProtocols[type] ?? firstAidProtocols.unclear;
}