"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ScanEye,
  ListChecks,
  Gauge,
  MessageCircleQuestion,
  Route,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  { label: "Recognize", description: "Image, voice, text, or live camera", icon: ScanEye },
  { label: "Verify", description: "Human confirms what the AI detected", icon: ListChecks },
  { label: "Assess", description: "Calibrated severity, not a guess", icon: Gauge },
  { label: "Explain", description: "Confidence, evidence, source, limits", icon: MessageCircleQuestion },
  { label: "Guide", description: "Time-sequenced, protocol-grounded steps", icon: Route },
  { label: "Connect", description: "Ambulance, family, and hospital, live", icon: Radio },
  { label: "Protect", description: "A verifiable report closes the loop", icon: ShieldCheck },
];

export function WorkflowDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Connecting line — desktop only */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block"
      />

      <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={step.label}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center lg:items-center"
            >
              <span
                className={cn(
                  "relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-surface-raised text-teal-strong dark:text-teal",
                  "border-border-strong shadow-[0_8px_24px_-12px_hsl(var(--shadow-color)/0.35)]"
                )}
              >
                <Icon size={22} strokeWidth={1.75} />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-strong text-[10px] font-semibold text-white dark:bg-teal dark:text-[#04201c]">
                  {i + 1}
                </span>
              </span>
              <p className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                {step.label}
              </p>
              <p className="mt-1 max-w-[11rem] text-xs leading-relaxed text-foreground-muted">
                {step.description}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}