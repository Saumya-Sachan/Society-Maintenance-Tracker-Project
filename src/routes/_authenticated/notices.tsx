import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Pin, CalendarClock } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({ meta: [{ title: "Notice board — Society Tracker" }] }),
  component: NoticeBoard,
});

async function fetchNotices() {
  const { data, error } = await supabase.from("notices")
    .select("*")
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("important", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function NoticeBoard() {
  const { data, isLoading } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });

  return (
    <div>
      <PageHeader title="Notice Board" description="Announcements and updates from your society administrators." />

      {isLoading ? (
        <div className="grid gap-4">{[0,1,2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <div className="surface-card grid place-items-center gap-3 p-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">No active notices</h3>
          <p className="max-w-sm text-sm text-muted-foreground">Announcements from the admin team will appear here.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {(data ?? []).map((n) => (
            <li key={n.id}>
              <Card className={"border-border " + (n.important ? "ring-2 ring-accent/40" : "")}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.important && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-accent/30">
                            <Pin className="h-3 w-3" /> Important
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-foreground">{n.title}</h3>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{n.body}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Posted {formatDateTime(n.created_at)}</span>
                    {n.expires_at && <span>Expires {formatDateTime(n.expires_at)}</span>}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
