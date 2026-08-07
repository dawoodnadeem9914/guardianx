import { Info, AlertTriangle, ShieldAlert, type LucideIcon } from "lucide-react";
import type { SafetyWarning, SafetyWarningLevel } from "@/lib/safety/safety-layer";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<
  SafetyWarningLevel,
  {
    icon: LucideIcon;
    classes: string;
    iconClass: string;
  }
> = {
  info: {
    icon: Info,
    classes: "border-info/20 bg-info/[0.05]",
    iconClass: "text-info",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-warning/25 bg-warning/[0.06]",
    iconClass: "text-warning",
  },
  critical: {
    icon: ShieldAlert,
    classes: "border-critical/25 bg-critical/[0.06]",
    iconClass: "text-critical",
  },
};

export function SafetyWarnings({ warnings }: { warnings: SafetyWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {warnings.map((warning) => {
        const style = LEVEL_STYLES[warning.level];
        const Icon = style.icon;
        return (
          <div
            key={warning.id}
            className={cn("flex items-start gap-3 rounded-xl border p-4", style.classes)}
          >
            <Icon size={16} className={cn("mt-0.5 shrink-0", style.iconClass)} />
            <div>
              <p className="text-sm font-medium text-foreground">{warning.title}</p>
              <p className="mt-0.5 text-sm text-foreground-muted">{warning.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}