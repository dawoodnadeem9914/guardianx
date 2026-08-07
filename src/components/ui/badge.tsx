import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        neutral: "border-border bg-background-alt text-foreground-muted",
        teal: "border-teal/25 bg-teal/10 text-teal-strong dark:text-teal",
        low: "border-success/25 bg-success/10 text-success",
        medium: "border-warning/25 bg-warning/10 text-warning",
        high: "border-[#f97316]/25 bg-[#f97316]/10 text-[#f97316]",
        critical: "border-critical/25 bg-critical/10 text-critical",
        info: "border-info/25 bg-info/10 text-info",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
