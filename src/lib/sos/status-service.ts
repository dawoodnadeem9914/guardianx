import { SOS_STATUS_SEQUENCE, type SosStatus } from "@/lib/sos/send-sos";

/**
 * Display metadata for a given SOS status. Kept separate from
 * `send-sos.ts` (which owns the *simulation*) so that both the live SOS
 * page and the Dashboard's "Latest SOS" widget read status labels from
 * one place instead of duplicating copy in two components.
 */
export interface SosStatusMeta {
  status: SosStatus | "cancelled";
  label: string;
  description: string;
  /** 0-100, used to drive progress bars. */
  progress: number;
}

const STATUS_META: Record<SosStatus | "cancelled", SosStatusMeta> = {
  preparing: {
    status: "preparing",
    label: "Preparing SOS",
    description: "Getting your emergency details ready to send.",
    progress: 15,
  },
  sending: {
    status: "sending",
    label: "Sending SOS",
    description: "Notifying your emergency contact now.",
    progress: 40,
  },
  contact_notified: {
    status: "contact_notified",
    label: "Guardian Contact Notified",
    description: "Your emergency contact has been alerted.",
    progress: 65,
  },
  ready: {
    status: "ready",
    label: "Emergency Ready",
    description: "Your Guardian Card and Report are ready to share with responders.",
    progress: 85,
  },
  completed: {
    status: "completed",
    label: "Completed",
    description: "This SOS has finished. Stay safe until help arrives if needed.",
    progress: 100,
  },
  cancelled: {
    status: "cancelled",
    label: "Cancelled",
    description: "This SOS was cancelled before it was sent.",
    progress: 0,
  },
};

export function getSosStatusMeta(status: SosStatus | "cancelled"): SosStatusMeta {
  return STATUS_META[status];
}

/** Index within the forward-progress sequence, or -1 for "cancelled". Useful for step indicators. */
export function getSosStatusIndex(status: SosStatus | "cancelled"): number {
  if (status === "cancelled") return -1;
  return SOS_STATUS_SEQUENCE.indexOf(status);
}