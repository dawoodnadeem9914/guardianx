/**
 * Static first-aid knowledge base.
 *
 * This is the file that gets replaced when GuardianX moves to a real
 * RAG-grounded knowledge base (WHO / Red Cross / AHA protocols, per the
 * V3.0 specification). Everything that consumes first-aid content reads
 * it through `getFirstAidProtocol()`, so that swap won't require any
 * caller to change.
 *
 * Milestone 5 adds 5 new emergency types (burns, fire, earthquake,
 * flood, road_accident) to support Simulation Mode's full scenario
 * list. AI Emergency Detection (detect-emergency.ts) is unaffected —
 * it only ever matched a subset of EmergencyType via keyword/hash
 * profiles, so it doesn't need to cover every type in this union.
 */

export type EmergencyType =
  | "stroke"
  | "severe_bleeding"
  | "choking"
  | "allergic_reaction"
  | "fracture"
  | "burns"
  | "fire"
  | "earthquake"
  | "flood"
  | "road_accident"
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
  burns: {
    type: "burns",
    label: "Burns",
    steps: [
      "Cool the burn under cool (not ice-cold) running water for 10 to 20 minutes.",
      "Remove tight clothing or jewelry near the burn before swelling starts.",
      "Cover the burn loosely with a clean, non-stick dressing.",
      "Do not apply ice, butter, or ointments to the burn.",
      "Call your local emergency number for burns larger than a hand, on the face, or that look deep.",
    ],
  },
  fire: {
    type: "fire",
    label: "Fire",
    steps: [
      "Get everyone out of the building immediately — do not stop to gather belongings.",
      "Stay low to the ground to avoid smoke inhalation.",
      "Feel doors before opening — do not open a door that is hot to the touch.",
      "Call your local emergency number once you are safely outside.",
      "Go to the designated meeting point and do not re-enter the building for any reason.",
    ],
  },
  earthquake: {
    type: "earthquake",
    label: "Earthquake",
    steps: [
      "Drop, cover, and hold on — get under sturdy furniture and protect your head and neck.",
      "Stay away from windows, mirrors, and anything that could fall.",
      "If outdoors, move to an open area away from buildings, trees, and power lines.",
      "After shaking stops, check for injuries and hazards like gas leaks before moving.",
      "Call your local emergency number if anyone is trapped or injured.",
    ],
  },
  flood: {
    type: "flood",
    label: "Flood",
    steps: [
      "Move to higher ground immediately — do not wait to see how high the water rises.",
      "Never walk or drive through moving flood water, even if it looks shallow.",
      "Avoid contact with flood water — it may be contaminated or electrically charged.",
      "Call your local emergency number if you are trapped or need rescue.",
      "Once safe, avoid returning until officials confirm the area is safe.",
    ],
  },
  road_accident: {
    type: "road_accident",
    label: "Road Accident",
    steps: [
      "Check for danger before approaching — turn on hazard lights and keep others away from traffic.",
      "Call your local emergency number and describe how many people are involved and their condition.",
      "Do not move injured people unless they are in immediate danger (e.g. fire, oncoming traffic).",
      "Apply firm pressure to any severe bleeding while waiting for help.",
      "Keep injured people calm and still until responders arrive.",
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