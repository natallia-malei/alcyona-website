import { supabase } from "./client";

const COVERS_BUCKET = "covers";

export async function uploadCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  return supabase.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
}
