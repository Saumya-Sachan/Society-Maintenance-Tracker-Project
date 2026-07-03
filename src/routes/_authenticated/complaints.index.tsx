import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { OverdueBadge } from "@/components/complaints/OverdueBadge";
import { CATEGORY_META, CATEGORY_OPTIONS, isOverdue, type ComplaintStatus } from "@/lib/complaints";
import { timeAgo } from "@/lib/format";
import { FilePlus2, Search, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/complaints/")({
  head: () => ({ meta: [{ title: "My Complaints — Society Tracker" }] }),
  component: ComplaintsList,
});

async function fetchMyComplaints(userId: string) {
  const { data, error } = await supabase
    .from("complaints").select("*")
    .eq("resident_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchThreshold() {
  const { data } = await supabase.from("society_settings").select("overdue_threshold_days").eq("id", 1).maybeSingle();
  return data?.overdue_threshold_days ?? 7;
}

function ComplaintsList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const complaintsQ = useQuery({
    queryKey: ["complaints", "mine", user?.id],
    queryFn: () => fetchMyComplaints(user!.id),
    enabled: !!user,
  });
  const thresholdQ = useQuery({ queryKey: ["settings", "threshold"], queryFn: fetchThreshold });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (complaintsQ.data ?? []).filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (category !== "all" && c.category !== category) return false;
      if (q && !c.description.toLowerCase().includes(q) && !(c.location ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [complaintsQ.data, search, status, category]);

  return (
    <div>
      <PageHeader
        title="My Complaints"
        description="Track the status of every issue you've raised."
        actions={
          <Button asChild>
            <Link to="/complaints/new"><FilePlus2 className="mr-2 h-4 w-4" />New complaint</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description or location" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {complaintsQ.isLoading ? (
        <div className="grid gap-3">
          {[0,1,2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={search !== "" || status !== "all" || category !== "all"} totalCount={complaintsQ.data?.length ?? 0} />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((c) => {
            const overdue = isOverdue(c.status, c.created_at, thresholdQ.data ?? 7);
            const meta = CATEGORY_META[c.category];
            const Icon = meta.icon;
            return (
              <li key={c.id}>
                <Link to="/complaints/$id" params={{ id: c.id }}
                  className="surface-card hover-lift group flex items-start gap-4 p-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {overdue && <OverdueBadge />}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-foreground/80">{c.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.location ? <>{c.location} · </> : null}Raised {timeAgo(c.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, totalCount }: { hasFilters: boolean; totalCount: number }) {
  return (
    <div className="surface-card grid place-items-center gap-3 p-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasFilters ? "No matching complaints" : totalCount === 0 ? "No complaints yet" : "Nothing to show"}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters ? "Try clearing your filters." : "When you raise your first complaint, it will appear here."}
      </p>
      {!hasFilters && (
        <Button asChild className="mt-2">
          <Link to="/complaints/new"><FilePlus2 className="mr-2 h-4 w-4" />Raise a complaint</Link>
        </Button>
      )}
    </div>
  );
}
