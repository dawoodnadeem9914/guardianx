"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Sparkles,
  ListChecks,
  Clock,
  Building2,
  Stethoscope,
  GraduationCap,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/brand/logo";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { WorkflowDiagram } from "@/components/marketing/workflow-diagram";

const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stats = [
  { value: "7", label: "verified steps, Recognize to Protect" },
  { value: "5", label: "point emergency timeline, Now to Until Help Arrives" },
  { value: "4", label: "compounding failure points closed, not one" },
  { value: "3", label: "SDGs the product is built against — 3, 9 & 11" },
];

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Explainable AI",
    description:
      "Every prediction ships with Confidence, Evidence, Reason, Source, and Limitations — never a bare percentage.",
  },
  {
    icon: ListChecks,
    title: "Verification Layer",
    description:
      "Before guidance is given, GuardianX asks you to confirm what it detected — the check no other emergency app has.",
  },
  {
    icon: Clock,
    title: "Emergency Timeline",
    description:
      "Now, 30 seconds, 1 minute, 5 minutes, until help arrives — guidance sequenced to the moment, not a static page.",
  },
  {
    icon: Building2,
    title: "Campus Mode",
    description:
      "Routes directly to Campus Security, the Health Centre, or a Dorm Warden, with a dashboard for safety teams.",
  },
  {
    icon: Stethoscope,
    title: "Hospital Dashboard",
    description:
      "A structured report reaches the receiving hospital before the ambulance does, with the patient's medical profile attached.",
  },
  {
    icon: GraduationCap,
    title: "Simulation Mode",
    description:
      "Practice CPR, fire, flood, earthquake, stroke, and more — so the real thing is never the first time.",
  },
];

const sdgs = [
  {
    number: "3",
    title: "Good Health & Well-being",
    description: "The primary SDG — reducing preventable harm in the first minutes of an emergency.",
  },
  {
    number: "9",
    title: "Industry, Innovation & Infrastructure",
    description: "An AI-native decision-support layer built as real, scalable public-safety infrastructure.",
  },
  {
    number: "11",
    title: "Sustainable Cities & Communities",
    description: "Campus and city-scale deployment models, from a single university to national partnerships.",
  },
];

export function LandingContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="gx-grid-bg gx-glow-teal pointer-events-none absolute inset-0 -z-10" />

        <motion.div
          variants={shouldReduceMotion ? undefined : heroContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"
        >
          <motion.div variants={shouldReduceMotion ? undefined : heroItem}>
            <Badge variant="teal" className="mx-auto">
              <LogoMark size={14} animated />
              The AI Emergency Copilot
            </Badge>
          </motion.div>

          <motion.h1
            variants={shouldReduceMotion ? undefined : heroItem}
            className="mt-7 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Recognize. Verify. Assess.
            <br />
            <span className="text-teal-strong dark:text-teal">
              Explain. Guide. Connect. Protect.
            </span>
          </motion.h1>

          <motion.p
            variants={shouldReduceMotion ? undefined : heroItem}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-foreground-muted sm:text-lg"
          >
            GuardianX closes the full loop in the first sixty seconds that matter most — the only
            emergency copilot that checks its own judgment against yours before it tells you what
            to do.
          </motion.p>

          <motion.div
            variants={shouldReduceMotion ? undefined : heroItem}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Button size="lg" asChild>
              <Link href="/register">
                Create an account
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* ================= STATS STRIP ================= */}
        <AnimatedSection delay={0.1} className="mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface-raised px-5 py-7 text-center sm:px-7">
                <p className="text-3xl font-semibold tracking-tight text-teal-strong dark:text-teal sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ================= WORKFLOW ================= */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <Badge variant="neutral" className="mx-auto">
              The full loop
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Every emergency, the same seven steps
            </h2>
            <p className="mt-3 text-balance text-base leading-relaxed text-foreground-muted">
              No step is skipped, and no step is guessed. This is the workflow behind every
              incident GuardianX handles.
            </p>
          </AnimatedSection>

          <div className="mt-16">
            <WorkflowDiagram />
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="border-t border-border bg-background-alt py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <Badge variant="neutral" className="mx-auto">
              Everything, in one copilot
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built for the moment it actually matters
            </h2>
          </AnimatedSection>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.title} delay={(i % 3) * 0.06}>
                  <Card interactive className="h-full p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal-strong dark:text-teal">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                      {feature.description}
                    </p>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SDG ================= */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <Badge variant="teal" className="mx-auto">
              Built against the SDGs
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Product design, not a mission statement
            </h2>
            <p className="mt-3 text-balance text-base leading-relaxed text-foreground-muted">
              Every feature in GuardianX maps back to one of three UN Sustainable Development
              Goals — not as marketing, but as the actual design brief.
            </p>
          </AnimatedSection>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {sdgs.map((sdg, i) => (
              <AnimatedSection key={sdg.number} delay={i * 0.08}>
                <Card className="h-full p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-strong text-sm font-semibold text-white dark:bg-teal dark:text-[#04201c]">
                    {sdg.number}
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                    {sdg.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                    {sdg.description}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <Card className="gx-grid-bg relative overflow-hidden p-10 text-center sm:p-14">
              <div className="gx-glow-teal pointer-events-none absolute inset-0" />
              <div className="relative">
                <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  The first sixty seconds deserve better than panic.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-foreground-muted">
                  Create your GuardianX account — it takes under a minute, and it&apos;s free.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" asChild>
                    <Link href="/register">
                      Create an account
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/login">I already have an account</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}