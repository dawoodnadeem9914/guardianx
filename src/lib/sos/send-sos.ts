/**
 * Simulated SOS sending service.
 *
 * `runSosSimulation()` is the ONLY function the rest of the app calls to
 * drive an SOS through its stages. It's written as an async generator on
 * purpose: a real implementation (Twilio delivery receipts, Firebase
 * Cloud Messaging acknowledgements, a hospital API callback, a live
 * ambulance-dispatch feed) would also naturally produce a *stream* of
 * status updates over time, not a single return value — so this shape
 * won't need to change when the simulation is replaced. Callers only
 * ever do `for await (const event of runSosSimulation()) { ... }`.
 *
 * Milestone 5 change: the generator now yields a small event object
 * (status + optional etaMinutes/assignedHospital) instead of a bare
 * status string, so the Emergency Progress Tracker can carry ETA and
 * hospital assignment through the rest of the lifecycle. This is the
 * only breaking change to this file's public shape in this milestone;
 * `SosStatus` itself only grew new values, it lost none.
 */

export type SosStatus =
  | "preparing"
  | "sending"
  | "contact_notified"
  | "ready"
  | "emergency_services_requested"
  | "ambulance_en_route"
  | "hospital_assigned"
  | "hospital_arrival"
  | "completed";

/** The forward-progress sequence. "cancelled" is a valid stored status
 *  (see the migrations) but is never produced by this simulation — a
 *  cancelled SOS never starts the pipeline in the first place. */
export const SOS_STATUS_SEQUENCE: SosStatus[] = [
  "preparing",
  "sending",
  "contact_notified",
  "ready",
  "emergency_services_requested",
  "ambulance_en_route",
  "hospital_assigned",
  "hospital_arrival",
  "completed",
];

export interface SosSimulationEvent {
  status: SosStatus;
  /** Set once "ambulance_en_route" is reached, and carried forward. */
  etaMinutes?: number;
  /** Set once "hospital_assigned" is reached, and carried forward. */
  assignedHospital?: string;
}

export interface SosSimulationOptions {
  /** Delay in ms before each status is yielded. Kept short but visible. */
  stepDelayMs?: number;
}

const SIMULATED_HOSPITALS = [
  "City General Hospital",
  "St. Mary's Medical Center",
  "Riverside Emergency Hospital",
  "Lakeside Regional Hospital",
];

function pickSimulatedHospital(): string {
  return SIMULATED_HOSPITALS[Math.floor(Math.random() * SIMULATED_HOSPITALS.length)];
}

function pickSimulatedEtaMinutes(): number {
  return 5 + Math.floor(Math.random() * 11); // 5–15 minutes
}

/**
 * Yields an event for each SosStatus in order, with a short delay
 * between them, so the UI can render the progression the way it will
 * once this is backed by real dispatch/notification services. Replace
 * the body of this function later — the signature and the sequence of
 * yielded statuses are the contract every caller depends on.
 */
export async function* runSosSimulation(
  options: SosSimulationOptions = {}
): AsyncGenerator<SosSimulationEvent, void, unknown> {
  const stepDelay = options.stepDelayMs ?? 1100;

  let etaMinutes: number | undefined;
  let assignedHospital: string | undefined;

  for (const status of SOS_STATUS_SEQUENCE) {
    await new Promise((resolve) => setTimeout(resolve, stepDelay));

    if (status === "ambulance_en_route") {
      etaMinutes = pickSimulatedEtaMinutes();
    }
    if (status === "hospital_assigned") {
      assignedHospital = pickSimulatedHospital();
    }
    if (status === "hospital_arrival") {
      etaMinutes = 0;
    }

    yield { status, etaMinutes, assignedHospital };
  }
}