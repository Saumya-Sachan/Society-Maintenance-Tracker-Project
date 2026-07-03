import { PRIORITY_META, type ComplaintPriority } from "@/lib/complaints";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: ComplaintPriority; className?: string }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      m.className, className,
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label} priority
    </span>
  );
}
