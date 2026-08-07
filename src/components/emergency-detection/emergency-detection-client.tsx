"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImageUp,
  FileText,
  Loader2,
  ShieldQuestion,
  CheckCircle2,
  RotateCcw,
  ListChecks,
  Gauge,
  MessageCircleQuestion,
  AlertTriangle,
  ClipboardList,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  detectEmergency,
  computeVerifiedConfidence,
  type DetectionResult,
} from "@/lib/ai/detect-emergency";
import { getFirstAidProtocol, DISCLAIMER } from "@/lib/ai/first-aid-protocols";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Step = "input" | "analyzing" | "verify" | "result";
type Mode = "image" | "text";

const severityMeta: Record<
  DetectionResult["severity"],
  {
    title: string;
    description: string;
  }
> = {
  low: {
    title: "Low",
    description: "Not urgent, but keep an eye on it and seek advice if anything changes.",
  },
  medium: {
    title: "Medium",
    description: "Attention needed soon. Consider contacting a healthcare provider.",
  },
  high: {
    title: "High",
    description: "Urgent. Emergency care is strongly recommended without delay.",
  },
  critical: {
    title: "Critical",
    description: "Life-threatening. Call your local emergency number immediately.",
  },
};

export function EmergencyDetectionClient({ userId }: { userId: string }) {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("input");
  const [mode, setMode] = React.useState<Mode>("text");
  const [symptomText, setSymptomText] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  const [result, setResult] = React.useState<DetectionResult | null>(null);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});
  const [verifiedConfidence, setVerifiedConfidence] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleImageSelect(file: File | null) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function resetAll() {
    setStep("input");
    setSymptomText("");
    handleImageSelect(null);
    setResult(null);
    setChecklist({});
    setVerifiedConfidence(null);
  }

  async function runDetection() {
    if (mode === "text" && symptomText.trim().length < 5) {
      toast.error("Describe the symptoms in a bit more detail first.");
      return;
    }
    if (mode === "image" && !imageFile) {
      toast.error("Choose an image to upload first.");
      return;
    }

    setStep("analyzing");

    const detection = await detectEmergency(
      mode === "text"
        ? { inputType: "text", text: symptomText }
        : { inputType: "image", imageFileName: imageFile?.name }
    );

    setResult(detection);

    if (detection.evidence.length === 0) {
      // Nothing to verify for an unclear result — go straight to the result.
      setVerifiedConfidence(detection.confidence);
      await saveDetection(detection, null, detection.confidence);
      setStep("result");
      return;
    }

    const initialChecklist = Object.fromEntries(detection.evidence.map((item) => [item, true]));
    setChecklist(initialChecklist);
    setStep("verify");
  }

  async function handleVerifyContinue() {
    if (!result) return;
    const adjusted = computeVerifiedConfidence(result.confidence, checklist);
    setVerifiedConfidence(adjusted);
    await saveDetection(result, checklist, adjusted);
    setStep("result");
  }

  async function saveDetection(
    detection: DetectionResult,
    responses: Record<string, boolean> | null,
    finalConfidence: number
  ) {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("emergency_detections").insert({
      user_id: userId,
      input_type: mode,
      input_summary: detection.inputSummary || (mode === "image" ? "Uploaded image" : "—"),
      emergency_type: detection.emergencyType,
      severity: detection.severity,
      confidence: detection.confidence,
      evidence: detection.evidence,
      reason: detection.reason,
      verification_responses: responses,
      verified_confidence: finalConfidence,
    });

    setSaving(false);

    if (error) {
      toast.error("Couldn't save this detection, but your result is still shown below.");
      return;
    }

    router.refresh();
  }

  // ---------------- Step: Input ----------------
  if (step === "input") {
    return (
      <Card className="p-6 sm:p-8">
        <div className="flex gap-2 rounded-full border border-border bg-background-alt p-1">
          <ModeTab active={mode === "text"} onClick={() => setMode("text")} icon={FileText}>
            Enter Symptoms
          </ModeTab>
          <ModeTab active={mode === "image"} onClick={() => setMode("image")} icon={ImageUp}>
            Upload Image
          </ModeTab>
        </div>

        <div className="mt-6">
          {mode === "text" ? (
            <div>
              <Textarea
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="Describe what you're seeing — e.g. 'Her face is drooping on one side and her speech is slurred.'"
                rows={6}
              />
              <p className="mt-2 text-xs text-foreground-subtle">
                The more specific you are, the more useful GuardianX&apos;s read will be.
              </p>
            </div>
          ) : (
            <div>
              {imagePreviewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Selected upload preview"
                    className="max-h-72 w-full object-contain bg-background-alt"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageSelect(null)}
                    aria-label="Remove image"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center transition-colors hover:border-teal">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
                    <ImageUp size={20} />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Click to upload an image
                  </span>
                  <span className="text-xs text-foreground-subtle">PNG or JPG</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <Button onClick={runDetection} className="mt-6 w-full sm:w-auto">
          Analyze
        </Button>
      </Card>
    );
  }

  // ---------------- Step: Analyzing ----------------
  if (step === "analyzing") {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <Loader2 size={28} className="animate-spin text-teal-strong dark:text-teal" />
        <div>
          <p className="text-sm font-medium text-foreground">Analyzing…</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            GuardianX is reviewing what you shared.
          </p>
        </div>
      </Card>
    );
  }

  // ---------------- Step: Verify ----------------
  if (step === "verify" && result) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <ShieldQuestion size={18} className="text-teal-strong dark:text-teal" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            GuardianX suspects: {result.label}
          </h2>
        </div>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Please confirm which of these you can actually observe. Uncheck anything that doesn&apos;t
          apply.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {result.evidence.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background-alt px-4 py-3 transition-colors hover:border-teal/50"
            >
              <input
                type="checkbox"
                checked={checklist[item] ?? true}
                onChange={(e) =>
                  setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-border-strong accent-teal-strong dark:accent-teal"
              />
              <span className="text-sm text-foreground">{item}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleVerifyContinue} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Continue"}
          </Button>
          <Button variant="secondary" onClick={resetAll} disabled={saving}>
            Start over
          </Button>
        </div>
      </Card>
    );
  }

  // ---------------- Step: Result ----------------
  if (step === "result" && result) {
    const finalConfidence = verifiedConfidence ?? result.confidence;
    const protocol = getFirstAidProtocol(result.emergencyType);
    const meta = severityMeta[result.severity];
    const hadVerification = result.evidence.length > 0;

    return (
      <div className="flex flex-col gap-6">
        {/* Risk Level Card */}
        <Card
          className={cn(
            "p-6 sm:p-8",
            result.severity === "critical" && "border-critical/30 bg-critical/[0.04]",
            result.severity === "high" && "border-[#f97316]/30 bg-[#f97316]/[0.04]",
            result.severity === "medium" && "border-warning/30 bg-warning/[0.04]",
            result.severity === "low" && "border-success/30 bg-success/[0.04]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Detected emergency
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {result.label}
              </h2>
            </div>
            <Badge variant={result.severity} className="px-3 py-1.5 text-sm">
              {meta.title} risk
            </Badge>
          </div>
          <p className="mt-3 text-sm text-foreground-muted">{meta.description}</p>
        </Card>

        {/* Explainable AI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleQuestion size={17} className="text-teal-strong dark:text-teal" />
              Why GuardianX thinks this
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-0">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                <Gauge size={13} />
                Confidence
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-alt">
                  <div
                    className="h-full rounded-full bg-teal-strong dark:bg-teal"
                    style={{ width: `${finalConfidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {finalConfidence.toFixed(0)}%
                </span>
              </div>
              {hadVerification && finalConfidence !== result.confidence && (
                <p className="mt-1.5 text-xs text-foreground-subtle">
                  Adjusted from an initial {result.confidence.toFixed(0)}% based on what you
                  confirmed.
                </p>
              )}
            </div>

            {hadVerification && (
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                  <ListChecks size={13} />
                  Evidence
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {result.evidence.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      {checklist[item] ? (
                        <CheckCircle2 size={15} className="shrink-0 text-success" />
                      ) : (
                        <X size={15} className="shrink-0 text-foreground-subtle" />
                      )}
                      <span
                        className={
                          checklist[item] ? "text-foreground" : "text-foreground-subtle line-through"
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Reason
              </p>
              <p className="mt-1.5 text-sm text-foreground-muted">{result.reason}</p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.06] p-3.5">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed text-foreground-muted">{DISCLAIMER}</p>
            </div>
          </CardContent>
        </Card>

        {/* First Aid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={17} className="text-teal-strong dark:text-teal" />
              First aid: {protocol.label}
            </CardTitle>
            <CardDescription>Follow these steps while help is on the way.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="flex flex-col gap-3">
              {protocol.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-semibold text-teal-strong dark:text-teal">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Button variant="secondary" onClick={resetAll} className="self-start">
          <RotateCcw size={15} />
          Run another detection
        </Button>
      </div>
    );
  }

  return null;
}

function ModeTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-teal-strong text-white dark:bg-teal dark:text-[#04201c]"
          : "text-foreground-muted hover:text-foreground"
      )}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}