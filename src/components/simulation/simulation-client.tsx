"use client";

import * as React from "react";
import Link from "next/link";
import {
  Brain,
  Wind,
  Droplet,
  Thermometer,
  Bone,
  ShieldAlert,
  Flame,
  Mountain,
  Waves,
  Car,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import type { EmergencyType } from "@/lib/ai/first-aid-protocols";
import { getFirstAidProtocol } from "@/lib/ai/first-aid-protocols";
import { getEmergencyTimeline } from "@/lib/report/emergency-timeline";
import {
  SIMULATION_SCENARIOS,
  getSimulationScenariosByCategory,
  type SimulationCategory,
} from "@/lib/simulation/scenarios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type View = "picker" | "practice" | "complete";

const SCENARIO_ICONS: Record<EmergencyType, LucideIcon> = {
  stroke: Brain,
  choking: Wind,
  severe_bleeding: Droplet,
  burns: Thermometer,
  fracture: Bone,
  allergic_reaction: ShieldAlert,
  fire: Flame,
  earthquake: Mountain,
  flood: Waves,
  road_accident: Car,
  unclear: ShieldAlert,
};

const CATEGORY_LABELS: Record<SimulationCategory, string> = {
  medical: "Medical Emergencies",
  disaster: "Disasters",
  accident: "Accidents",
};

const CATEGORIES: SimulationCategory[] = ["medical", "disaster", "accident"];

export function SimulationClient() {
  const [view, setView] = React.useState<View>("picker");
  const [selectedType, setSelectedType] = React.useState<EmergencyType | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);

  function startScenario(type: EmergencyType) {
    setSelectedType(type);
    setStepIndex(0);
    setView("practice");
  }

  function exitToPicker() {
    setView("picker");
    setSelectedType(null);
    setStepIndex(0);
  }

  function practiceAgain() {
    setStepIndex(0);
    setView("practice");
  }

  // ---------------- PICKER ----------------
  if (view === "picker") {
    return (
      <div className="flex flex-col gap-8">
        {CATEGORIES.map((category) => (
          <div key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getSimulationScenariosByCategory(category).map((scenario) => {
                const Icon = SCENARIO_ICONS[scenario.type];
                return (
                  <button
                    key={scenario.type}
                    type="button"
                    onClick={() => startScenario(scenario.type)}
                    className="gx-hover-lift flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-raised p-5 text-left"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal-strong dark:text-teal">
                        <Icon size={18} />
                      </span>
                      <Badge variant={scenario.severity}>{scenario.severity}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{scenario.title}</p>
                      <p className="mt-1 text-sm text-foreground-muted">{scenario.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedType) return null;

  const protocol = getFirstAidProtocol(selectedType);
  const timeline = getEmergencyTimeline(selectedType);
  const totalSteps = Math.min(protocol.steps.length, timeline.length);

  // ---------------- PRACTICE ----------------
  if (view === "practice") {
    const currentTimelinePoint = timeline[stepIndex];
    const currentAction = protocol.steps[stepIndex];
    const isLastStep = stepIndex === totalSteps - 1;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={exitToPicker}
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Exit practice
          </button>
          <p className="text-xs text-foreground-subtle">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {protocol.label}
            </h2>
            <Badge variant="teal">{currentTimelinePoint.label}</Badge>
          </div>

          <div className="mt-6 flex h-2 gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={
                  "h-full flex-1 rounded-full " +
                  (i <= stepIndex ? "bg-teal-strong dark:bg-teal" : "bg-background-alt")
                }
              />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-teal/25 bg-teal/[0.05] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
              At {currentTimelinePoint.label.toLowerCase()}
            </p>
            <p className="mt-2 text-base text-foreground">{currentAction}</p>
          </div>

          <div className="mt-6 flex gap-3">
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
                <ArrowLeft size={15} />
                Previous
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => (isLastStep ? setView("complete") : setStepIndex((i) => i + 1))}
            >
              {isLastStep ? "Finish practice" : "Next step"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------- COMPLETE ----------------
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 size={26} />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground">Practice complete</p>
        <p className="mt-1 text-sm text-foreground-muted">
          You walked through all {totalSteps} steps for {protocol.label}. Practicing before an
          emergency is what makes the real thing feel familiar instead of frightening.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={practiceAgain}>
          <RotateCcw size={15} />
          Practice again
        </Button>
        <Button onClick={exitToPicker}>
          <GraduationCap size={15} />
          Choose another scenario
        </Button>
      </div>
      <Link
        href="/dashboard/emergency"
        className="mt-1 text-xs text-foreground-subtle hover:text-foreground hover:underline"
      >
        Or try real AI Emergency Detection →
      </Link>
    </Card>
  );
}

// Keeps the full scenario count available to any parent that wants to
// show "X scenarios available" without importing the raw array itself.
export const SIMULATION_SCENARIO_COUNT = SIMULATION_SCENARIOS.length;