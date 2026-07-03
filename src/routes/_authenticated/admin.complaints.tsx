import { createFileRoute, Link } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { OverdueBadge } from "@/components/complaints/OverdueBadge";
import { CATEGORY_META, CATEGORY_OPTIONS, isOverdue, type ComplaintStatus } from "@/lib/complaints";
import { timeAgo } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/complaints")({
  ssr: false,
  beforeLoad: ensureAdmin,
  head: () => ({ meta: [{ title: "All complaints — Admin" }] }),
  component: AdminComplaints,
});



function AdminComplaints() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");

  const q = useQuery({
    queryKey: ["admin", "complaints", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
        console.log("Complaints Data:", data);
        console.log("Complaints Error:", error);
      if (error) throw error;
      return data ?? [];
    },
  });
  const threshold = useQuery({
    queryKey: ["settings", "threshold"],
    queryFn: async () => {
      const { data } = await supabase.from("society_settings").select("overdue_threshold_days").eq("id", 1).maybeSingle();
      return data?.overdue_threshold_days ?? 7;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data ?? []).filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (category !== "all" && c.category !== category) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      if (term && !c.description.toLowerCase().includes(term) && !(c.location ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [q.data, search, status, category, priority]);

  return (
    <div>
      <PageHeader title="All complaints" description="Search, filter, and manage every issue raised in your society." />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-14 text-center text-sm text-muted-foreground">No complaints match your filters.</div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,3fr)_140px_140px_160px_120px] gap-4 border-b border-border bg-surface-elevated px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
            <div>Complaint</div><div>Status</div><div>Priority</div><div>Resident</div><div className="text-right">Raised</div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((c) => {
              const meta = CATEGORY_META[c.category];
              const Icon = meta.icon;
              const overdue = isOverdue(c.status, c.created_at, threshold.data ?? 7);
              const profile = (c as any).profiles as { full_name: string; flat_number: string | null; block: string | null } | null;
              return (
                <li key={c.id}>
                  <Link to="/admin/complaints/$id" params={{ id: c.id }} onClick={() => console.log("Clicked complaint:", c.id)}
                    className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/40 lg:grid-cols-[minmax(0,3fr)_140px_140px_160px_120px] lg:items-center">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="h-4 w-4"/>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{meta.label}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><StatusBadge status={c.status} />{overdue && <OverdueBadge />}</div>
                    <div><PriorityBadge priority={c.priority} /></div>
                    <div className="min-w-0 text-sm">
                      <p className="truncate">{profile?.full_name ?? "—"}</p>
                      {profile?.block && <p className="truncate text-xs text-muted-foreground">{profile.block}-{profile.flat_number}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground lg:text-right">{timeAgo(c.created_at)}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
