import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getSignedPhotoUrls } from "@/lib/storage";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { OverdueBadge } from "@/components/complaints/OverdueBadge";
import { ComplaintTimeline, type HistoryEntry } from "@/components/complaints/ComplaintTimeline";
import { PhotoLightbox } from "@/components/complaints/PhotoLightbox";
import { CATEGORY_META, isOverdue, type ComplaintPriority, type ComplaintStatus } from "@/lib/complaints";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/complaints/$id")({
  ssr: false,
  beforeLoad: ensureAdmin,
  head: () => ({ meta: [{ title: "Manage complaint — Admin" }] }),
  component: AdminComplaintDetail,
});


function AdminComplaintDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints")
        .select("*, profiles:resident_id(full_name, email, phone, flat_number, block)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const historyQ = useQuery({
    queryKey: ["complaint", id, "history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaint_history").select("*").eq("complaint_id", id).order("created_at");
      if (error) throw error;
      return (data ?? []) as HistoryEntry[];
    },
  });
  const photosQ = useQuery({
    queryKey: ["complaint", id, "photos", q.data?.photo_urls],
    queryFn: () => getSignedPhotoUrls(q.data?.photo_urls ?? []),
    enabled: !!q.data,
  });
  const threshold = useQuery({
    queryKey: ["settings", "threshold"],
    queryFn: async () => {
      const { data } = await supabase.from("society_settings").select("overdue_threshold_days").eq("id", 1).maybeSingle();
      return data?.overdue_threshold_days ?? 7;
    },
  });

  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [priority, setPriority] = useState<ComplaintPriority | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (q.isLoading) return <div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64" /></div>;
  const c = q.data;
  if (!c) return <div className="text-center text-muted-foreground">Complaint not found.</div>;

  const meta = CATEGORY_META[c.category];
  const Icon = meta.icon;
  const overdue = isOverdue(c.status, c.created_at, threshold.data ?? 7);
  const profile = (c as any).profiles as { full_name: string; email: string; phone: string | null; flat_number: string | null; block: string | null } | null;

  const currentStatus = (status || c.status) as ComplaintStatus;
  const currentPriority = (priority || c.priority) as ComplaintPriority;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: { status?: ComplaintStatus; priority?: ComplaintPriority } = {};
      if (status && status !== c.status) updates.status = status;
      if (priority && priority !== c.priority) updates.priority = priority;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from("complaints").update(updates).eq("id", c.id);
        if (error) throw error;
      }
      if (note.trim()) {
        const { error: hErr } = await supabase.from("complaint_history").insert({
          complaint_id: c.id, actor_id: user.id, event_type: "note", note: note.trim(),
        });
        if (hErr) throw hErr;
      }
      toast.success("Complaint updated");
      setNote(""); setStatus(""); setPriority("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "complaint", id] }),
        qc.invalidateQueries({ queryKey: ["complaint", id, "history"] }),
        qc.invalidateQueries({ queryKey: ["admin", "complaints", "list"] }),
        qc.invalidateQueries({ queryKey: ["admin", "complaints", "all"] }),
      ]);
      // TODO: send Resend status-update email to resident once RESEND_API_KEY is configured.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <button onClick={() => navigate({ to: "/admin/complaints" })} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to all complaints
      </button>

      <PageHeader
        title={meta.label + " complaint"}
        description={"Raised " + formatDateTime(c.created_at)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {overdue && <OverdueBadge />}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{c.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {c.location && (
                  <div><h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <p className="mt-1 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground" />{c.location}</p></div>
                )}
                {c.contact_phone && (
                  <div><h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <p className="mt-1 flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" />{c.contact_phone}</p></div>
                )}
              </div>
              {photosQ.data && photosQ.data.length > 0 && (
                <div><h3 className="mb-2 text-sm font-medium text-muted-foreground">Photos</h3><PhotoLightbox urls={photosQ.data} /></div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Progress timeline</h3>
              {historyQ.isLoading ? <Skeleton className="h-40" /> : <ComplaintTimeline entries={historyQ.data ?? []} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-semibold">Manage</h3>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={currentStatus} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={currentPriority} onValueChange={(v) => setPriority(v as ComplaintPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Add note</Label>
                <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context for the resident and audit trail" />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save update
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Resident</h3>
              {profile && (
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" />{profile.full_name}</p>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.phone && <p className="text-muted-foreground">{profile.phone}</p>}
                  {(profile.block || profile.flat_number) && <p className="text-muted-foreground">Flat {profile.block}-{profile.flat_number}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
