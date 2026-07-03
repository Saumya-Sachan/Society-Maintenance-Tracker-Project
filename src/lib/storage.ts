import { supabase } from "@/integrations/supabase/client";

const BUCKET = "complaint-photos";

export async function uploadComplaintPhotos(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function getSignedPhotoUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
}
