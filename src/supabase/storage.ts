import { supabase } from "./client";

async function uploadImage(file: File, bucket: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function uploadCover(file: File): Promise<string> {
  return uploadImage(file, "covers");
}

export function uploadPhoto(file: File): Promise<string> {
  return uploadImage(file, "photos");
}
