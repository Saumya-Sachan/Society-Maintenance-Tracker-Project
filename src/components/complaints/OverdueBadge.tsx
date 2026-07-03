import { AlertTriangle } from "lucide-react";

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-semibold text-destructive ring-1 ring-destructive/30">
      <AlertTriangle className="h-3 w-3" />
      Overdue
    </span>
  );
}
