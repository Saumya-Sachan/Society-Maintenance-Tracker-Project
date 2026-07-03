import { createFileRoute } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  ssr: false,
  beforeLoad: ensureAdmin,
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["society-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("society_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });
  const [days, setDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.data?.overdue_threshold_days) setDays(q.data.overdue_threshold_days);
  }, [q.data]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("society_settings").update({ overdue_threshold_days: days }).eq("id", 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["society-settings"] });
    qc.invalidateQueries({ queryKey: ["settings", "threshold"] });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Configure how your society tracks and escalates complaints." />
      <Card className="border-border">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="threshold">Overdue threshold (days)</Label>
            <p className="text-xs text-muted-foreground">Unresolved complaints older than this many days are flagged as overdue.</p>
            <Input id="threshold" type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border">
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Adding administrators.</strong> Admin roles are granted via database access — to promote a resident, insert their user id into the <code className="rounded bg-muted px-1">user_roles</code> table with role <code className="rounded bg-muted px-1">admin</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
