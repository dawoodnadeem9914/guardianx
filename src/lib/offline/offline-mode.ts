/**
 * Offline Mode preference.
 *
 * This is a device-local UI preference ("simulate operating without a
 * network connection"), not incident data — so unlike everything else
 * in Milestone 4, it's intentionally backed by `localStorage` rather
 * than a new Supabase table. Kept in `src/lib/` (not a component) so
 * the storage mechanism can be swapped later (e.g. for a real
 * connectivity-aware service worker) without touching any UI code that
 * calls these functions.
 *
 * No React here on purpose — this file stays framework-agnostic
 * business logic; the component that uses it owns its own useState/
 * useEffect around these functions.
 */

const STORAGE_KEY = "guardianx-offline-mode";
export const OFFLINE_MODE_EVENT = "guardianx:offline-mode-change";

export function getOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.)
    return false;
  }
}

export function setOfflineMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent<boolean>(OFFLINE_MODE_EVENT, { detail: enabled }));
  } catch {
    // Fail silently — the toggle just won't persist across reloads.
  }
}

/** Returns an unsubscribe function. Lets multiple components (e.g. a
 *  header indicator and the SOS page) stay in sync with the same toggle. */
export function subscribeToOfflineMode(callback: (enabled: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  function handler(event: Event) {
    callback((event as CustomEvent<boolean>).detail);
  }

  window.addEventListener(OFFLINE_MODE_EVENT, handler);
  return () => window.removeEventListener(OFFLINE_MODE_EVENT, handler);
}