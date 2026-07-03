import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getSignedPhotoUrls } from "@/lib/storage";
import { PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { OverdueBadge } from "@/components/complaints/OverdueBadge";
import { ComplaintTimeline, type HistoryEntry } from "@/components/complaints/ComplaintTimeline";
import { PhotoLightbox } from "@/components/complaints/PhotoLightbox";
import { CATEGORY_META, isOverdue } from "@/lib/complaints";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  head: () => ({ meta: [{ title: "Complaint detail — Society Tracker" }] }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("id", id).maybeSingle();
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
  const thresholdQ = useQuery({
    queryKey: ["settings", "threshold"],
    queryFn: async () => {
      const { data } = await supabase.from("society_settings").select("overdue_threshold_days").eq("id", 1).maybeSingle();
      return data?.overdue_threshold_days ?? 7;
    },
  });

  if (q.isLoading) {
    return <div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }
  const c = q.data;
  if (!c) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-lg font-semibold">Complaint not found</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/complaints">Back to complaints</Link></Button>
      </div>
    );
  }

  const meta = CATEGORY_META[c.category];
  const Icon = meta.icon;
  const overdue = isOverdue(c.status, c.created_at, thresholdQ.data ?? 7);
  const backTo = role === "admin" ? "/admin/complaints" : "/complaints";

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate({ to: backTo })} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title={meta.label + " complaint"}
        description={"Raised on " + formatDateTime(c.created_at)}
        actions={role === "admin" && <Button asChild><Link to="/admin/complaints/$id" params={{ id: c.id }}>Manage</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
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
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" />{c.location}</p>
                </div>
              )}
              {c.contact_phone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-foreground"><Phone className="h-4 w-4 text-muted-foreground" />{c.contact_phone}</p>
                </div>
              )}
            </div>
            {photosQ.data && photosQ.data.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Photos</h3>
                <PhotoLightbox urls={photosQ.data} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Progress timeline</h3>
            {historyQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ComplaintTimeline entries={historyQ.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
