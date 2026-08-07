"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, HeartPulse, Users, Loader2, Wifi, WifiOff, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  EmergencyDetection,
  EmergencyContact,
  MedicalProfile,
  SosRequest,
  SosContactSnapshot,
} from "@/types/supabase";
import { getFirstAidProtocol } from "@/lib/ai/first-aid-protocols";
import { runSosSimulation, type SosStatus } from "@/lib/sos/send-sos";
import { evaluateSafetyLayer } from "@/lib/safety/safety-layer";
import { getOfflineMode, setOfflineMode } from "@/lib/offline/offline-mode";
import { HoldToActivateButton } from "@/components/sos/hold-to-activate-button";
import { SosStatusCard } from "@/components/sos/sos-status-card";
import { SafetyWarnings } from "@/components/sos/safety-warnings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type Phase = "idle" | "countdown" | "sending" | "done";

interface SosClientProps {
  userId: string;
  latestDetection: EmergencyDetection | null;
  contacts: EmergencyContact[];
  medicalProfile: MedicalProfile | null;
  latestSosRequest: SosRequest | null;
}

const COUNTDOWN_SECONDS = 5;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SosClient({
  userId,
  latestDetection,
  contacts,
  medicalProfile,
  latestSosRequest,
}: SosClientProps) {
  const router = useRouter();

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [countdown, setCountdown] = React.useState(COUNTDOWN_SECONDS);
  const [currentStatus, setCurrentStatus] = React.useState<SosStatus>("preparing");
  const [etaMinutes, setEtaMinutes] = React.useState<number | null>(null);
  const [assignedHospital, setAssignedHospital] = React.useState<string | null>(null);
  const [activeCreatedAt, setActiveCreatedAt] = React.useState<string | null>(null);
  const [activeUpdatedAt, setActiveUpdatedAt] = React.useState<string | null>(null);

  const [selectedContactId, setSelectedContactId] = React.useState<string | null>(
    contacts[0]?.id ?? null
  );
  const [offline, setOffline] = React.useState(false);

  const countdownTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    // Reading localStorage must happen after mount (SSR has no
    // localStorage), same justified exception as the theme toggle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(getOfflineMode());
  }, []);

  React.useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  function toggleOffline(checked: boolean) {
    setOffline(checked);
    setOfflineMode(checked);
  }

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

  const emergencyLabel = latestDetection
    ? getFirstAidProtocol(latestDetection.emergency_type as Parameters<typeof getFirstAidProtocol>[0])
        .label
    : null;

  const displayConfidence = latestDetection
    ? latestDetection.verified_confidence ?? latestDetection.confidence
    : null;

  const safetyWarnings = evaluateSafetyLayer({
    confidence: displayConfidence,
    emergencyType: latestDetection?.emergency_type ?? null,
    hasEmergencyContact: contacts.length > 0,
    hasMedicalProfile: Boolean(medicalProfile),
  });

  function handleHoldActivate() {
    if (!latestDetection) {
      toast.error("Run AI Emergency Detection first so GuardianX knows what to report.");
      return;
    }
    cancelledRef.current = false;
    setCountdown(COUNTDOWN_SECONDS);
    setPhase("countdown");

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          if (!cancelledRef.current) void beginSending();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleCancelCountdown() {
    cancelledRef.current = true;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setPhase("idle");
    toast.info("SOS cancelled — nothing was sent.");
  }

  async function beginSending() {
    if (!latestDetection) return;
    setPhase("sending");
    setCurrentStatus("preparing");
    setEtaMinutes(null);
    setAssignedHospital(null);

    const supabase = createClient();
    const contactSnapshot: SosContactSnapshot | null = selectedContact
      ? {
          name: selectedContact.name,
          relationship: selectedContact.relationship,
          phone: selectedContact.phone,
        }
      : null;

    const { data: inserted, error: insertError } = await supabase
      .from("sos_requests")
      .insert({
        user_id: userId,
        detection_id: latestDetection.id,
        contact_id: selectedContact?.id ?? null,
        emergency_type: latestDetection.emergency_type,
        severity: latestDetection.severity,
        confidence: displayConfidence ?? latestDetection.confidence,
        status: "preparing",
        guardian_contact_snapshot: contactSnapshot,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      toast.error(insertError?.message || "Couldn't start the SOS. Please try again.");
      setPhase("idle");
      return;
    }

    setActiveCreatedAt(inserted.created_at);
    setActiveUpdatedAt(inserted.updated_at);

    for await (const event of runSosSimulation()) {
      setCurrentStatus(event.status);
      if (event.etaMinutes != null) setEtaMinutes(event.etaMinutes);
      if (event.assignedHospital) setAssignedHospital(event.assignedHospital);

      const updatePayload: { status: SosStatus; eta_minutes?: number; assigned_hospital?: string } = {
        status: event.status,
      };
      if (event.etaMinutes != null) updatePayload.eta_minutes = event.etaMinutes;
      if (event.assignedHospital) updatePayload.assigned_hospital = event.assignedHospital;

      const { data: updated } = await supabase
        .from("sos_requests")
        .update(updatePayload)
        .eq("id", inserted.id)
        .select()
        .single();
      if (updated) setActiveUpdatedAt(updated.updated_at);
    }

    setPhase("done");
    router.refresh();
  }

  function handleStartAnother() {
    setPhase("idle");
    setActiveCreatedAt(null);
    setActiveUpdatedAt(null);
    setEtaMinutes(null);
    setAssignedHospital(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Offline Mode toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background-alt px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 text-teal-strong dark:text-teal">
            {offline ? <WifiOff size={16} /> : <Wifi size={16} />}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {offline ? "Offline Protection Enabled" : "Offline Mode"}
            </p>
            <p className="text-xs text-foreground-subtle">
              {offline
                ? "Actions are simulated as queued locally and will sync once reconnected."
                : "Simulate GuardianX operating without a network connection."}
            </p>
          </div>
        </div>
        <Switch checked={offline} onCheckedChange={toggleOffline} aria-label="Toggle offline mode" />
      </div>

      {phase === "idle" && (
        <>
          <Card className="p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
              Latest detected emergency
            </p>
            {latestDetection ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {emergencyLabel}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant={latestDetection.severity}>{latestDetection.severity}</Badge>
                  <Badge variant="neutral">{(displayConfidence ?? 0).toFixed(0)}% confidence</Badge>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-foreground-muted">
                  No detection on record yet.{" "}
                  <Link href="/dashboard/emergency" className="font-medium text-teal-strong hover:underline dark:text-teal">
                    Run AI Emergency Detection
                  </Link>{" "}
                  first.
                </p>
              </div>
            )}
            {latestDetection && (
              <p className="mt-1 text-xs text-foreground-subtle">
                Detected {formatTimestamp(latestDetection.created_at)}
              </p>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2.5">
                <HeartPulse size={16} className="text-teal-strong dark:text-teal" />
                <p className="text-sm font-semibold text-foreground">Medical summary</p>
              </div>
              {medicalProfile ? (
                <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground-subtle">Blood type</dt>
                    <dd className="font-medium text-foreground">{medicalProfile.blood_type ?? "Unknown"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-subtle">Allergies</dt>
                    <dd className="font-medium text-foreground">{medicalProfile.allergies || "None recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-subtle">Organ donor</dt>
                    <dd className="font-medium text-foreground">{medicalProfile.organ_donor ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-foreground-muted">
                  No medical profile yet.{" "}
                  <Link href="/dashboard/medical-profile" className="font-medium text-teal-strong hover:underline dark:text-teal">
                    Add one
                  </Link>
                  .
                </p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-teal-strong dark:text-teal" />
                <p className="text-sm font-semibold text-foreground">Selected contact</p>
              </div>
              {contacts.length > 0 ? (
                <div className="mt-3">
                  <select
                    value={selectedContactId ?? ""}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.relationship ? `(${c.relationship})` : ""} — Priority {c.priority}
                      </option>
                    ))}
                  </select>
                  {selectedContact && (
                    <p className="mt-2 text-xs text-foreground-subtle">{selectedContact.phone}</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-foreground-muted">
                  No contacts saved.{" "}
                  <Link href="/dashboard/contacts" className="font-medium text-teal-strong hover:underline dark:text-teal">
                    Add one
                  </Link>
                  .
                </p>
              )}
            </Card>
          </div>

          <SafetyWarnings warnings={safetyWarnings} />

          <div className="flex flex-col items-center gap-4 py-6">
            <HoldToActivateButton onActivate={handleHoldActivate} disabled={!latestDetection} />
            <p className="max-w-xs text-center text-xs text-foreground-subtle">
              Press and hold for 3 seconds. Releasing early cancels — nothing is sent.
            </p>
          </div>

          {latestSosRequest && (
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                Previous SOS
              </p>
              <SosStatusCard
                status={latestSosRequest.status}
                emergencyLabel={
                  getFirstAidProtocol(
                    latestSosRequest.emergency_type as Parameters<typeof getFirstAidProtocol>[0]
                  ).label
                }
                severity={latestSosRequest.severity}
                confidence={latestSosRequest.confidence}
                createdAt={latestSosRequest.created_at}
                updatedAt={latestSosRequest.updated_at}
                contact={latestSosRequest.guardian_contact_snapshot}
                etaMinutes={latestSosRequest.eta_minutes}
                assignedHospital={latestSosRequest.assigned_hospital}
                compact
              />
            </div>
          )}
        </>
      )}

      {phase === "countdown" && (
        <Card className="flex flex-col items-center gap-6 p-14 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-foreground-subtle">
            Sending in
          </p>
          <p className="text-7xl font-semibold tabular-nums text-critical">{countdown}</p>
          <Button variant="secondary" onClick={handleCancelCountdown}>
            <X size={15} />
            Cancel SOS
          </Button>
        </Card>
      )}

      {phase === "sending" && latestDetection && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-xs text-foreground-subtle">
            <Loader2 size={13} className="animate-spin" />
            Live — updating automatically
          </div>
          <SosStatusCard
            status={currentStatus}
            emergencyLabel={emergencyLabel ?? "Emergency"}
            severity={latestDetection.severity}
            confidence={displayConfidence ?? latestDetection.confidence}
            createdAt={activeCreatedAt ?? new Date().toISOString()}
            updatedAt={activeUpdatedAt ?? new Date().toISOString()}
            etaMinutes={etaMinutes}
            assignedHospital={assignedHospital}
            contact={
              selectedContact
                ? {
                    name: selectedContact.name,
                    relationship: selectedContact.relationship,
                    phone: selectedContact.phone,
                  }
                : null
            }
          />
        </div>
      )}

      {phase === "done" && latestDetection && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SOS complete</CardTitle>
              <CardDescription>
                {assignedHospital
                  ? `Care team notified at ${assignedHospital}. Your Guardian Card and Report are ready to share.`
                  : "Your Guardian Card and Guardian Report are ready to share with responders."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 pt-0">
              <Button asChild>
                <Link href="/dashboard/guardian-card">
                  View Guardian Card
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/dashboard/guardian-report">
                  View Guardian Report
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button variant="ghost" onClick={handleStartAnother}>
                Start another SOS
              </Button>
            </CardContent>
          </Card>

          <SosStatusCard
            status="completed"
            emergencyLabel={emergencyLabel ?? "Emergency"}
            severity={latestDetection.severity}
            confidence={displayConfidence ?? latestDetection.confidence}
            createdAt={activeCreatedAt ?? new Date().toISOString()}
            updatedAt={activeUpdatedAt ?? new Date().toISOString()}
            etaMinutes={etaMinutes}
            assignedHospital={assignedHospital}
            contact={
              selectedContact
                ? {
                    name: selectedContact.name,
                    relationship: selectedContact.relationship,
                    phone: selectedContact.phone,
                  }
                : null
            }
          />
        </div>
      )}
    </div>
  );
}