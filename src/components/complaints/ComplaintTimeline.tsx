import { STATUS_META, PRIORITY_META, type ComplaintStatus, type ComplaintPriority } from "@/lib/complaints";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, CircleDot, MessageSquare, Sparkles } from "lucide-react";

export type HistoryEntry = {
  id: string;
  event_type: string;
  previous_status: ComplaintStatus | null;
  new_status: ComplaintStatus | null;
  previous_priority: ComplaintPriority | null;
  new_priority: ComplaintPriority | null;
  note: string | null;
  created_at: string;
  actor_name?: string | null;
};

function iconFor(event: string, status: ComplaintStatus | null) {
  if (event === "created") return Sparkles;
  if (status === "resolved") return CheckCircle2;
  if (event === "note") return MessageSquare;
  return CircleDot;
}

function describe(entry: HistoryEntry): string {
  if (entry.event_type === "created") return "Complaint submitted";
  if (entry.event_type === "status_change" && entry.new_status)
    return `Marked as ${STATUS_META[entry.new_status].label}`;
  if (entry.event_type === "priority_change" && entry.new_priority)
    return `Priority set to ${PRIORITY_META[entry.new_priority].label}`;
  if (entry.event_type === "note") return "Note added";
  return "Update";
}

export function ComplaintTimeline({ entries }: { entries: HistoryEntry[] }) {
  const sorted = [...entries].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {sorted.map((e) => {
        const Icon = iconFor(e.event_type, e.new_status);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft ring-4 ring-background">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-foreground">{describe(e)}</p>
              <time className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</time>
            </div>
            {e.actor_name && <p className="mt-0.5 text-xs text-muted-foreground">by {e.actor_name}</p>}
            {e.note && <p className="mt-2 rounded-md bg-muted/60 p-3 text-sm text-foreground/80">{e.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
