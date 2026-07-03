import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { OverdueBadge } from "@/components/complaints/OverdueBadge";
import { CATEGORY_META, isOverdue, type ComplaintCategory, type ComplaintPriority, type ComplaintStatus } from "@/lib/complaints";
import { timeAgo } from "@/lib/format";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Inbox as InboxIcon, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!(data ?? []).some((r) => r.role === "admin")) throw redirect({ to: "/complaints" });
  },
  head: () => ({ meta: [{ title: "Admin dashboard — Society Tracker" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  useAuth();
  const complaintsQ = useQuery({
    queryKey: ["admin", "complaints", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const thresholdQ = useQuery({
    queryKey: ["settings", "threshold"],
    queryFn: async () => {
      const { data } = await supabase.from("society_settings").select("overdue_threshold_days").eq("id", 1).maybeSingle();
      return data?.overdue_threshold_days ?? 7;
    },
  });

  const stats = useMemo(() => {
    const list = complaintsQ.data ?? [];
    const threshold = thresholdQ.data ?? 7;
    const byStatus = { open: 0, in_progress: 0, resolved: 0 } as Record<ComplaintStatus, number>;
    const byPriority = { low: 0, medium: 0, high: 0 } as Record<ComplaintPriority, number>;
    const byCategory = {} as Record<ComplaintCategory, number>;
    let overdue = 0;
    for (const c of list) {
      byStatus[c.status]++;
      byPriority[c.priority]++;
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      if (isOverdue(c.status, c.created_at, threshold)) overdue++;
    }
    // Monthly trend for last 6 months
    const now = new Date();
    const months: { label: string; created: number; resolved: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString(undefined, { month: "short" }), created: 0, resolved: 0 });
    }
    for (const c of list) {
      const created = new Date(c.created_at);
      const idx = 5 - (now.getMonth() - created.getMonth() + (now.getFullYear() - created.getFullYear()) * 12);
      if (idx >= 0 && idx < 6) months[idx].created++;
      if (c.resolved_at) {
        const r = new Date(c.resolved_at);
        const ri = 5 - (now.getMonth() - r.getMonth() + (now.getFullYear() - r.getFullYear()) * 12);
        if (ri >= 0 && ri < 6) months[ri].resolved++;
      }
    }
    return { total: list.length, byStatus, byPriority, byCategory, overdue, months };
  }, [complaintsQ.data, thresholdQ.data]);

  const loading = complaintsQ.isLoading;
  const recent = (complaintsQ.data ?? []).slice(0, 6);
  const overdueList = (complaintsQ.data ?? []).filter((c) => isOverdue(c.status, c.created_at, thresholdQ.data ?? 7)).slice(0, 5);

  const categoryData = Object.entries(stats.byCategory).map(([k, v]) => ({
    name: CATEGORY_META[k as ComplaintCategory].label, value: v,
  }));
  const priorityData = [
    { name: "Low", value: stats.byPriority.low },
    { name: "Medium", value: stats.byPriority.medium },
    { name: "High", value: stats.byPriority.high },
  ];
  const CHART_COLORS = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)"];

  return (
    <div>
      <PageHeader title="Overview" description="A pulse on maintenance operations across your society." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total complaints" value={stats.total} icon={InboxIcon} tone="primary" loading={loading} />
        <StatCard label="Open" value={stats.byStatus.open} icon={Clock} tone="highlight" loading={loading} />
        <StatCard label="In progress" value={stats.byStatus.in_progress} icon={TrendingUp} tone="secondary" loading={loading} />
        <StatCard label="Resolved" value={stats.byStatus.resolved} icon={CheckCircle2} tone="success" loading={loading} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone="destructive" loading={loading} />
      </div>

      {overdueList.length > 0 && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Needs attention · {overdueList.length} overdue</h3>
            </div>
            <ul className="grid gap-2">
              {overdueList.map((c) => (
                <li key={c.id}>
                  <Link to="/admin/complaints/$id" params={{ id: c.id }}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm hover:bg-surface-elevated">
                    <span className="min-w-0 flex-1 truncate font-medium">{CATEGORY_META[c.category].label} — {c.description}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Monthly trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="created" stroke="var(--chart-1)" strokeWidth={2.5} name="Created" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="resolved" stroke="var(--chart-2)" strokeWidth={2.5} name="Resolved" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold">By priority</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {priorityData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-around text-xs">
              {priorityData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-muted-foreground">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Complaints by category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="var(--secondary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Recent activity</h3>
            <ul className="space-y-3">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link to="/admin/complaints/$id" params={{ id: c.id }}
                    className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{CATEGORY_META[c.category].label}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </Link>
                </li>
              ))}
              {recent.length === 0 && !loading && <p className="text-sm text-muted-foreground">No complaints yet.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone, loading,
}: { label: string; value: number; icon: typeof AlertTriangle; tone: "primary"|"success"|"destructive"|"secondary"|"highlight"; loading?: boolean }) {
  const toneClass = {
    primary:     "bg-primary-soft text-primary",
    success:     "bg-success/15 text-success",
    destructive: "bg-destructive/12 text-destructive",
    secondary:   "bg-secondary/15 text-secondary",
    highlight:   "bg-highlight/15 text-highlight-foreground",
  }[tone];
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneClass}>
          <Icon className="h-5 w-5" />
        </div>
        {loading ? <Skeleton className="mt-3 h-8 w-16" /> : (
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
        )}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
