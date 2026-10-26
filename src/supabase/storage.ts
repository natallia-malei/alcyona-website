import { supabase } from "./client";
import { compressImage } from "../utils/compressImage";

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

// Имя файла — уникальный UUID, содержимое по нему никогда не меняется,
// поэтому кешируем на год
const ONE_YEAR_SECONDS = "31536000";

async function uploadImage(file: File, bucket: string): Promise<string> {
  const image = await compressImage(file);
  const ext = EXT_BY_TYPE[image.type] ?? file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, image, {
    contentType: image.type,
    cacheControl: ONE_YEAR_SECONDS,
    upsert: false,
  });

  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function uploadCover(file: File): Promise<string> {
  return uploadImage(file, "covers");
}

export function uploadPhoto(file: File): Promise<string> {
  return uploadImage(file, "photos");
}
