import { createFileRoute } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Pin, Plus, Loader2, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  ssr: false,
  beforeLoad: ensureAdmin,
  head: () => ({ meta: [{ title: "Notices — Admin" }] }),
  component: AdminNotices,
});

function AdminNotices() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [important, setImportant] = useState(false);
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*")
        .order("important", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = async () => {
    if (!user) return;
    if (title.trim().length < 3) return toast.error("Title is too short.");
    if (body.trim().length < 5) return toast.error("Add more detail to the notice body.");
    setSaving(true);
    const { error } = await supabase.from("notices").insert({
      title: title.trim(), body: body.trim(), important,
      expires_at: expires ? new Date(expires).toISOString() : null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notice published");
    setTitle(""); setBody(""); setImportant(false); setExpires(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin", "notices"] });
    qc.invalidateQueries({ queryKey: ["notices"] });
    // TODO: if important, send Resend broadcast to all residents once RESEND_API_KEY is configured.
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Notice deleted");
    qc.invalidateQueries({ queryKey: ["admin", "notices"] });
    qc.invalidateQueries({ queryKey: ["notices"] });
  };

  return (
    <div>
      <PageHeader
        title="Notices" description="Post community announcements and pin critical updates."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New notice</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post a notice</DialogTitle>
                <DialogDescription>Visible to all residents in the notice board.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>Body</Label><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div><Label className="text-sm">Mark as important</Label><p className="text-xs text-muted-foreground">Pinned to top with a highlight.</p></div>
                  <Switch checked={important} onCheckedChange={setImportant} />
                </div>
                <div className="space-y-2"><Label>Expires (optional)</Label><Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {q.isLoading ? (
        <div className="grid gap-3">{[0,1,2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="surface-card grid place-items-center gap-2 p-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"><Megaphone className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold">No notices yet</h3>
          <p className="text-sm text-muted-foreground">Publish your first announcement to residents.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {(q.data ?? []).map((n) => (
            <li key={n.id}>
              <Card className={"border-border " + (n.important ? "ring-2 ring-accent/40" : "")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.important && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-accent/30">
                            <Pin className="h-3 w-3" />Important
                          </span>
                        )}
                        <h3 className="font-semibold text-foreground">{n.title}</h3>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{n.body}</p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Posted {formatDateTime(n.created_at)}{n.expires_at ? ` · expires ${formatDateTime(n.expires_at)}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
