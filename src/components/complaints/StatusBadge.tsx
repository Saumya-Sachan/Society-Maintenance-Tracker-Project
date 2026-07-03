import { STATUS_META, type ComplaintStatus } from "@/lib/complaints";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      m.className, className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}
