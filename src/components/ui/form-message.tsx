import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormMessage({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        type === "error"
          ? "border-critical/25 bg-critical/10 text-critical"
          : "border-success/25 bg-success/10 text-success"
      )}
    >
      {type === "error" ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      )}
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
