import type { EmergencyType } from "@/lib/ai/first-aid-protocols";
import type { Severity } from "@/types/supabase";

/**
 * Simulation Mode scenario catalog.
 *
 * Deliberately holds only what's specific to *practicing* a scenario
 * (title, short description, category for grouping) — not the first-aid
 * steps or timeline, which already live in `first-aid-protocols.ts` and
 * `emergency-timeline.ts`. The simulation client pulls that content via
 * `getFirstAidProtocol()`/`getEmergencyTimeline()` for the selected
 * scenario's `type`, so nothing here duplicates it.
 */

export type SimulationCategory = "medical" | "disaster" | "accident";

export interface SimulationScenario {
  type: EmergencyType;
  title: string;
  description: string;
  severity: Severity;
  category: SimulationCategory;
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    type: "stroke",
    title: "Stroke",
    description: "Practice recognizing FAST warning signs and responding calmly.",
    severity: "critical",
    category: "medical",
  },
  {
    type: "choking",
    title: "Choking",
    description: "Practice back blows and abdominal thrusts for a blocked airway.",
    severity: "high",
    category: "medical",
  },
  {
    type: "severe_bleeding",
    title: "Severe Bleeding",
    description: "Practice applying direct pressure to control heavy bleeding.",
    severity: "critical",
    category: "medical",
  },
  {
    type: "burns",
    title: "Burns",
    description: "Practice cooling a burn safely and knowing when to call for help.",
    severity: "medium",
    category: "medical",
  },
  {
    type: "fracture",
    title: "Fracture",
    description: "Practice immobilizing a suspected fracture without causing further harm.",
    severity: "medium",
    category: "medical",
  },
  {
    type: "allergic_reaction",
    title: "Allergic Reaction",
    description: "Practice recognizing anaphylaxis and using an epinephrine auto-injector.",
    severity: "high",
    category: "medical",
  },
  {
    type: "fire",
    title: "Fire",
    description: "Practice a safe, calm evacuation and knowing what not to do.",
    severity: "critical",
    category: "disaster",
  },
  {
    type: "earthquake",
    title: "Earthquake",
    description: "Practice drop, cover, and hold on, plus post-shake safety checks.",
    severity: "high",
    category: "disaster",
  },
  {
    type: "flood",
    title: "Flood",
    description: "Practice moving to safety and avoiding common flood dangers.",
    severity: "high",
    category: "disaster",
  },
  {
    type: "road_accident",
    title: "Road Accident",
    description: "Practice keeping a scene safe and helping without causing more harm.",
    severity: "critical",
    category: "accident",
  },
];

export function getSimulationScenario(type: EmergencyType): SimulationScenario | undefined {
  return SIMULATION_SCENARIOS.find((scenario) => scenario.type === type);
}

export function getSimulationScenariosByCategory(
  category: SimulationCategory
): SimulationScenario[] {
  return SIMULATION_SCENARIOS.filter((scenario) => scenario.category === category);
}