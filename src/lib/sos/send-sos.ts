/**
 * Simulated SOS sending service.
 *
 * `runSosSimulation()` is the ONLY function the rest of the app calls to
 * drive an SOS through its stages. It's written as an async generator on
 * purpose: a real implementation (Twilio delivery receipts, Firebase
 * Cloud Messaging acknowledgements, a hospital API callback) would also
 * naturally produce a *stream* of status updates over time, not a single
 * return value — so this shape won't need to change when the simulation
 * is replaced. Callers only ever do `for await (const status of
 * runSosSimulation()) { ... }`.
 */

export type SosStatus = "preparing" | "sending" | "contact_notified" | "ready" | "completed";

/** The forward-progress sequence. "cancelled" is a valid stored status
 *  (see the migration) but is never produced by this simulation — a
 *  cancelled SOS never starts the pipeline in the first place. */
export const SOS_STATUS_SEQUENCE: SosStatus[] = [
  "preparing",
  "sending",
  "contact_notified",
  "ready",
  "completed",
];

export interface SosSimulationOptions {
  /** Delay in ms before each status is yielded. Kept short but visible. */
  stepDelayMs?: number;
}

/**
 * Yields each SosStatus in order, with a short delay between them, so the
 * UI can render the progression the way it will once this is backed by a
 * real notification service. Replace the body of this function later —
 * the signature and the sequence of yielded values are the contract every
 * caller depends on.
 */
export async function* runSosSimulation(
  options: SosSimulationOptions = {}
): AsyncGenerator<SosStatus, void, unknown> {
  const stepDelay = options.stepDelayMs ?? 1100;

  for (const status of SOS_STATUS_SEQUENCE) {
    await new Promise((resolve) => setTimeout(resolve, stepDelay));
    yield status;
  }
}