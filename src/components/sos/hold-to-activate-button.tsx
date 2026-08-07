"use client";

import * as React from "react";
import { Siren } from "lucide-react";
import { cn } from "@/lib/utils";

const HOLD_DURATION_MS = 3000;
const CIRCUMFERENCE = 2 * Math.PI * 46;

interface HoldToActivateButtonProps {
  onActivate: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Press-and-hold button requiring ~3 seconds of continuous hold before
 * firing `onActivate`. Releasing (pointer up, pointer leave, or pointer
 * cancel) at any point before that cancels cleanly — no SOS is ever
 * triggered by an accidental tap.
 */
export function HoldToActivateButton({
  onActivate,
  onCancel,
  disabled = false,
  label = "Hold to send SOS",
}: HoldToActivateButtonProps) {
  const [holding, setHolding] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHold() {
    if (disabled || timeoutRef.current) return;
    setHolding(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setHolding(false);
      onActivate();
    }, HOLD_DURATION_MS);
  }

  function cancelHold() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setHolding(false);
      onCancel?.();
    }
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={holding ? "Keep holding to send SOS" : label}
      className={cn(
        "relative flex h-40 w-40 touch-none select-none items-center justify-center rounded-full border-4 transition-colors duration-200 sm:h-48 sm:w-48",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-critical/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled
          ? "cursor-not-allowed border-border bg-background-alt text-foreground-subtle opacity-50"
          : "cursor-pointer border-critical/30 bg-critical text-white active:scale-[0.98]"
      )}
    >
      {/* Radial progress ring — fills over HOLD_DURATION_MS while holding */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={holding ? 0 : CIRCUMFERENCE}
          style={{
            transition: holding
              ? `stroke-dashoffset ${HOLD_DURATION_MS}ms linear`
              : "stroke-dashoffset 200ms ease-out",
          }}
        />
      </svg>

      <div className="relative flex flex-col items-center gap-1.5 px-4 text-center">
        <Siren size={30} />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {holding ? "Keep holding…" : label}
        </span>
      </div>
    </button>
  );
}