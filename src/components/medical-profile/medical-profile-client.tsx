"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Droplet,
  Pill,
  ShieldAlert,
  FileText,
  Heart,
  Ruler,
  Weight,
  Pencil,
  Loader2,
  Cake,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MedicalProfile, Gender, BloodType } from "@/types/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface MedicalProfileClientProps {
  userId: string;
  initialProfile: MedicalProfile | null;
}

interface FormState {
  full_name: string;
  date_of_birth: string;
  gender: Gender | "";
  blood_type: BloodType | "";
  height_cm: string;
  weight_kg: string;
  allergies: string;
  medications: string;
  conditions: string;
  notes: string;
  organ_donor: boolean;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const bloodTypeOptions: { value: BloodType; label: string }[] = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "unknown", label: "Unknown" },
];

function emptyForm(): FormState {
  return {
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    height_cm: "",
    weight_kg: "",
    allergies: "",
    medications: "",
    conditions: "",
    notes: "",
    organ_donor: false,
  };
}

function profileToForm(profile: MedicalProfile): FormState {
  return {
    full_name: profile.full_name,
    date_of_birth: profile.date_of_birth ?? "",
    gender: profile.gender ?? "",
    blood_type: profile.blood_type ?? "",
    height_cm: profile.height_cm != null ? String(profile.height_cm) : "",
    weight_kg: profile.weight_kg != null ? String(profile.weight_kg) : "",
    allergies: profile.allergies ?? "",
    medications: profile.medications ?? "",
    conditions: profile.conditions ?? "",
    notes: profile.notes ?? "",
    organ_donor: profile.organ_donor,
  };
}

const selectClass =
  "flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50";

export function MedicalProfileClient({ userId, initialProfile }: MedicalProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState(initialProfile);
  const [mode, setMode] = React.useState<"view" | "edit">(initialProfile ? "view" : "edit");
  const [form, setForm] = React.useState<FormState>(
    initialProfile ? profileToForm(initialProfile) : emptyForm()
  );
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (form.full_name.trim().length < 2) {
      next.full_name = "Full name must be at least 2 characters.";
    }

    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      if (dob > new Date()) {
        next.date_of_birth = "Date of birth can't be in the future.";
      }
    }

    if (form.height_cm) {
      const h = Number(form.height_cm);
      if (Number.isNaN(h) || h <= 0 || h > 272) {
        next.height_cm = "Enter a height between 1 and 272 cm.";
      }
    }

    if (form.weight_kg) {
      const w = Number(form.weight_kg);
      if (Number.isNaN(w) || w <= 0 || w > 500) {
        next.weight_kg = "Enter a weight between 1 and 500 kg.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const supabase = createClient();

    const payload = {
      user_id: userId,
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      blood_type: form.blood_type || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      allergies: form.allergies.trim() || null,
      medications: form.medications.trim() || null,
      conditions: form.conditions.trim() || null,
      notes: form.notes.trim() || null,
      organ_donor: form.organ_donor,
    };

    const { data, error } = profile
      ? await supabase
          .from("medical_profiles")
          .update(payload)
          .eq("id", profile.id)
          .select()
          .single()
      : await supabase.from("medical_profiles").insert(payload).select().single();

    setSaving(false);

    if (error) {
      toast.error(error.message || "Couldn't save your medical profile. Please try again.");
      return;
    }

    setProfile(data);
    setMode("view");
    toast.success(profile ? "Medical profile updated." : "Medical profile created.");
    router.refresh();
  }

  function handleCancel() {
    if (!profile) return;
    setForm(profileToForm(profile));
    setErrors({});
    setMode("view");
  }

  if (mode === "edit") {
    return (
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {profile ? "Edit your medical profile" : "Create your medical profile"}
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Only you can see this. It&apos;s shared with responders and hospitals during an active,
          verified incident once that milestone ships.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6" noValidate>
          {/* Personal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Aisyah Rahman"
                required
              />
              {errors.full_name && (
                <p className="mt-1.5 text-xs text-critical">{errors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.date_of_birth && (
                <p className="mt-1.5 text-xs text-critical">{errors.date_of_birth}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value as Gender | "")}
                className={selectClass}
              >

                {genderOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Physical */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="blood_type">Blood type</Label>
              <select
                id="blood_type"
                value={form.blood_type}
                onChange={(e) => update("blood_type", e.target.value as BloodType | "")}
                className={selectClass}
              >
                <option value="">Unknown</option>
                {bloodTypeOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                max="272"
                value={form.height_cm}
                onChange={(e) => update("height_cm", e.target.value)}
                placeholder="170"
              />
              {errors.height_cm && (
                <p className="mt-1.5 text-xs text-critical">{errors.height_cm}</p>
              )}
            </div>

            <div>
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                max="500"
                value={form.weight_kg}
                onChange={(e) => update("weight_kg", e.target.value)}
                placeholder="62"
              />
              {errors.weight_kg && (
                <p className="mt-1.5 text-xs text-critical">{errors.weight_kg}</p>
              )}
            </div>
          </div>

          {/* Medical */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                placeholder="Penicillin, peanuts…"
              />
            </div>
            <div>
              <Label htmlFor="medications">Current medications</Label>
              <Textarea
                id="medications"
                value={form.medications}
                onChange={(e) => update("medications", e.target.value)}
                placeholder="Metformin 500mg, twice daily…"
              />
            </div>
            <div>
              <Label htmlFor="conditions">Chronic diseases</Label>
              <Textarea
                id="conditions"
                value={form.conditions}
                onChange={(e) => update("conditions", e.target.value)}
                placeholder="Asthma, type 2 diabetes…"
              />
            </div>
            <div>
              <Label htmlFor="notes">Emergency notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything a responder should know immediately…"
              />
            </div>
          </div>

          {/* Organ donor */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-background-alt px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 text-teal-strong dark:text-teal">
                <Heart size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Organ donor</p>
                <p className="text-xs text-foreground-subtle">
                  {form.organ_donor ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <Switch
              checked={form.organ_donor}
              onCheckedChange={(checked) => update("organ_donor", checked)}
              aria-label="Organ donor"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
            </Button>
            {profile && (
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    );
  }

  // ---------- View mode: "nice cards" ----------
  if (!profile) return null; // unreachable (mode defaults to "edit" when no profile), kept for type-safety

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-foreground-subtle">
          Last updated{" "}
          {new Date(profile.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setMode("edit")}>
          <Pencil size={14} />
          Edit profile
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={17} className="text-teal-strong dark:text-teal" />
              Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            <InfoRow label="Full name" value={profile.full_name} />
            <InfoRow
              label="Date of birth"
              value={
                profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"
              }
              icon={Cake}
            />
            <InfoRow
              label="Gender"
              value={
                genderOptions.find((g) => g.value === profile.gender)?.label ?? "Prefer not to say"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplet size={17} className="text-teal-strong dark:text-teal" />
              Physical
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            <InfoRow label="Blood type" value={profile.blood_type ?? "Unknown"} />
            <InfoRow
              label="Height"
              value={profile.height_cm ? `${profile.height_cm} cm` : "Not set"}
              icon={Ruler}
            />
            <InfoRow
              label="Weight"
              value={profile.weight_kg ? `${profile.weight_kg} kg` : "Not set"}
              icon={Weight}
            />
            <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
              <span className="text-foreground-subtle">Organ donor</span>
              <Badge variant={profile.organ_donor ? "low" : "neutral"}>
                {profile.organ_donor ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert size={17} className="text-teal-strong dark:text-teal" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="whitespace-pre-line text-sm text-foreground-muted">
              {profile.allergies || "None recorded."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill size={17} className="text-teal-strong dark:text-teal" />
              Medications &amp; conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Current medications
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground-muted">
                {profile.medications || "None recorded."}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Chronic diseases
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground-muted">
                {profile.conditions || "None recorded."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={17} className="text-teal-strong dark:text-teal" />
              Emergency notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="whitespace-pre-line text-sm text-foreground-muted">
              {profile.notes || "None recorded."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <span className="flex items-center gap-1.5 text-foreground-subtle">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}