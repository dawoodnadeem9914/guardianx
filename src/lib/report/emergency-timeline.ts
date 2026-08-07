import type { TimelineStep } from "@/lib/report/guardian-report";
import type { EmergencyType } from "@/lib/ai/first-aid-protocols";

/**
 * Emergency Timeline knowledge base. Kept separate from
 * `first-aid-protocols.ts` (a distinct concern — timed pacing vs. the
 * steps themselves) and from `guardian-report.ts` (which only owns the
 * `TimelineStep` shape, not this content). Like the first-aid protocols,
 * this is the file that gets replaced when timelines become dynamically
 * generated per the V3.0 specification's grounded pipeline.
 */

const TIMELINES: Record<EmergencyType, TimelineStep[]> = {
  stroke: [
    { label: "Now", instruction: "Call your local emergency number and note the exact time symptoms started." },
    { label: "30 Seconds", instruction: "Help them sit or lie down safely with their head slightly raised." },
    { label: "1 Minute", instruction: "Loosen tight clothing and keep talking calmly to monitor responsiveness." },
    { label: "5 Minutes", instruction: "Do not give food, water, or medication — keep monitoring breathing." },
    { label: "Until Help Arrives", instruction: "Stay with them, keep them still, and report any changes to responders." },
  ],
  severe_bleeding: [
    { label: "Now", instruction: "Call your local emergency number and apply firm direct pressure to the wound." },
    { label: "30 Seconds", instruction: "Keep steady pressure — do not lift the cloth to check." },
    { label: "1 Minute", instruction: "Raise the injured area above heart level if possible." },
    { label: "5 Minutes", instruction: "Add more cloth on top if blood soaks through; keep pressure constant." },
    { label: "Until Help Arrives", instruction: "Watch for pale or clammy skin and keep the person warm and still." },
  ],
  choking: [
    { label: "Now", instruction: "Ask if they can cough or speak; call for help if they can't." },
    { label: "30 Seconds", instruction: "Give 5 firm back blows between the shoulder blades." },
    { label: "1 Minute", instruction: "Follow with 5 abdominal thrusts if the airway is still blocked." },
    { label: "5 Minutes", instruction: "Continue alternating back blows and abdominal thrusts." },
    { label: "Until Help Arrives", instruction: "If they become unresponsive, begin CPR and stay on the line with emergency services." },
  ],
  allergic_reaction: [
    { label: "Now", instruction: "Call your local emergency number if breathing is affected." },
    { label: "30 Seconds", instruction: "Help them use an epinephrine auto-injector if they have one." },
    { label: "1 Minute", instruction: "Have them sit upright for breathing difficulty, or lie flat if faint." },
    { label: "5 Minutes", instruction: "Remove or avoid further exposure to the suspected trigger." },
    { label: "Until Help Arrives", instruction: "Stay with them and be ready to begin CPR if they become unresponsive." },
  ],
  fracture: [
    { label: "Now", instruction: "Keep the injured area still — do not attempt to realign it." },
    { label: "30 Seconds", instruction: "Support the area above and below the injury." },
    { label: "1 Minute", instruction: "Apply a cold pack wrapped in cloth to reduce swelling, if available." },
    { label: "5 Minutes", instruction: "Call your local emergency number if movement or breathing is affected." },
    { label: "Until Help Arrives", instruction: "Watch for signs of shock — pale skin, rapid breathing." },
  ],
  unclear: [
    { label: "Now", instruction: "Call your local emergency number immediately." },
    { label: "30 Seconds", instruction: "Stay close and keep the person as calm and comfortable as possible." },
    { label: "1 Minute", instruction: "Avoid specific medical treatment without professional guidance." },
    { label: "5 Minutes", instruction: "Keep watching for any new or worsening signs." },
    { label: "Until Help Arrives", instruction: "Be ready to describe exactly what you observed to responders." },
  ],
};

export function getEmergencyTimeline(type: EmergencyType): TimelineStep[] {
  return TIMELINES[type] ?? TIMELINES.unclear;
}