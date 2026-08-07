import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

/**
 * Logo mark: a shield (protection) containing an ECG heartbeat trace
 * (life / vitals), with small circuit nodes at the shield's shoulders
 * (AI / intelligence). Single stroke weight throughout so it scales
 * cleanly from favicon to hero size, in both themes.
 */
export function LogoMark({ className, size = 32, animated = false }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="GuardianX logo"
    >
      {/* Shield outline */}
      <path
        d="M24 4.5L8 10.4V22.6C8 33.1 14.6 40.6 24 43.5C33.4 40.6 40 33.1 40 22.6V10.4L24 4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Circuit nodes at the shoulders — AI / intelligence motif */}
      <circle cx="14.5" cy="14" r="1.6" fill="currentColor" />
      <circle cx="33.5" cy="14" r="1.6" fill="currentColor" />
      <path d="M14.5 15.6V18.5M33.5 15.6V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* ECG heartbeat trace through the shield */}
      <path
        d="M11 25H17L19.5 18L24 32L27 22L29.5 25H37"
        stroke="var(--gx-teal, #14b8a6)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={320}
        style={
          animated
            ? {
                strokeDasharray: 320,
                animation: "ecg-draw 3.2s ease-in-out infinite",
              }
            : undefined
        }
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconSize?: number;
  animated?: boolean;
  wordmark?: boolean;
}

export function Logo({ className, iconSize = 30, animated = false, wordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={iconSize} animated={animated} className="text-foreground" />
      {wordmark && (
        <span className="font-sans text-[1.05rem] font-semibold tracking-tight text-foreground">
          Guardian<span className="text-teal-strong dark:text-teal">X</span>
        </span>
      )}
    </div>
  );
}
