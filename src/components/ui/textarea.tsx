import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "flex w-full resize-y rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle transition-colors",
          "focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };