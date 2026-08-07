import { SOS_STATUS_SEQUENCE, type SosStatus } from "@/lib/sos/send-sos";

/**
 * Display metadata for a given SOS status. Kept separate from
 * `send-sos.ts` (which owns the *simulation*) so that every consumer —
 * the live SOS page, the Dashboard's "Latest SOS" widget, Family Live
 * Updates, and the Hospital view — reads status labels from one place
 * instead of duplicating copy across components.
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
    progress: 10,
  },
  sending: {
    status: "sending",
    label: "Sending SOS",
    description: "Notifying your emergency contact now.",
    progress: 25,
  },
  contact_notified: {
    status: "contact_notified",
    label: "Guardian Contact Notified",
    description: "Your emergency contact has been alerted.",
    progress: 40,
  },
  ready: {
    status: "ready",
    label: "Emergency Ready",
    description: "Your Guardian Card and Report are ready to share with responders.",
    progress: 50,
  },
  emergency_services_requested: {
    status: "emergency_services_requested",
    label: "Emergency Services Requested",
    description: "A formal request has been sent to local emergency services.",
    progress: 60,
  },
  ambulance_en_route: {
    status: "ambulance_en_route",
    label: "Ambulance En Route",
    description: "An ambulance has been dispatched and is on the way.",
    progress: 72,
  },
  hospital_assigned: {
    status: "hospital_assigned",
    label: "Hospital Assigned",
    description: "A receiving hospital has been assigned for this emergency.",
    progress: 84,
  },
  hospital_arrival: {
    status: "hospital_arrival",
    label: "Hospital Arrival",
    description: "The patient has arrived at the hospital.",
    progress: 94,
  },
  completed: {
    status: "completed",
    label: "Completed",
    description: "This emergency has been marked complete.",
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