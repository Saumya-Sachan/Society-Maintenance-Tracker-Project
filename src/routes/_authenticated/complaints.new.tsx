import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUpload } from "@/components/complaints/PhotoUpload";
import { uploadComplaintPhotos } from "@/lib/storage";
import { CATEGORY_OPTIONS, type ComplaintCategory } from "@/lib/complaints";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complaints/new")({
  head: () => ({ meta: [{ title: "New Complaint — Society Tracker" }] }),
  component: NewComplaint,
});

const schema = z.object({
  category: z.enum(["plumbing","electrical","cleaning","security","parking","lift","water_supply","gardening","common_area","other"]),
  description: z.string().trim().min(10, "Please describe the issue (10+ characters)").max(2000),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  contact_phone: z.string().trim().max(20).optional().or(z.literal("")),
});

function NewComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ category, description, location, contact_phone: contact });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSaving(true);
    try {
      const photoPaths = photos.length > 0 ? await uploadComplaintPhotos(user.id, photos) : [];
      const { data, error } = await supabase.from("complaints").insert({
        resident_id: user.id,
        category: parsed.data.category,
        description: parsed.data.description,
        location: parsed.data.location || null,
        contact_phone: parsed.data.contact_phone || null,
        photo_urls: photoPaths,
      }).select("id").single();
      console.log("INSERT DATA:", data);
      console.log("INSERT ERROR:", error);
      if (error) throw error;
      // TODO: send Resend "complaint created" email once RESEND_API_KEY secret is added.
      toast.success("Complaint submitted");
      navigate({ to: "/complaints/$id", params: { id: data.id } });
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Raise a new complaint" description="Give us enough detail to route this to the right team." />
      <Card className="border-border">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
                  <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location within society</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tower B, 12th floor lobby" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe the issue</Label>
              <Textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What's happening? Since when? Any relevant context?" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Preferred contact number (optional)</Label>
              <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)}
                placeholder="If we should call you instead" />
            </div>

            <div className="space-y-2">
              <Label>Photos (optional)</Label>
              <PhotoUpload files={photos} onChange={setPhotos} />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/complaints" })}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit complaint
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
