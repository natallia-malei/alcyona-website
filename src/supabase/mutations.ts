import type { BandInfo, Photo, Release, Video } from "../types";
import { supabase } from "./client";

// ----- Releases -----

export async function deleteRelease(id: string): Promise<void> {
  const { error } = await supabase.from("releases").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertRelease(release: Release): Promise<void> {
  const { error } = await supabase.from("releases").upsert({
    id: release.id,
    title: release.title,
    type: release.type,
    release_date: release.releaseDate,
    cover_url: release.coverUrl,
    description: release.description,
    is_featured: release.isFeatured ?? false,
    links: release.links,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ----- Photos -----

export async function deletePhoto(id: string): Promise<void> {
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw error;
}

export async function addPhoto(photo: Omit<Photo, "id">, position: number): Promise<Photo> {
  const { data, error } = await supabase
    .from("photos")
    .insert({ url: photo.url, position })
    .select("id, url")
    .single();

  if (error) throw error;
  return { id: data.id, url: data.url };
}

export async function updatePhotoPositions(photos: Photo[]): Promise<void> {
  const updates = photos.map((p, idx) =>
    supabase.from("photos").update({ position: idx + 1 }).eq("id", p.id),
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

// ----- Videos -----

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

export async function addVideo(video: Omit<Video, "id">, position: number): Promise<Video> {
  const { data, error } = await supabase
    .from("videos")
    .insert({ youtube_id: video.youtubeId, title: video.title, position })
    .select("id, youtube_id, title")
    .single();

  if (error) throw error;
  return { id: data.id, youtubeId: data.youtube_id, title: data.title };
}

export async function updateVideoPositions(videos: Video[]): Promise<void> {
  const updates = videos.map((v, idx) =>
    supabase.from("videos").update({ position: idx + 1 }).eq("id", v.id),
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

// ----- Band -----

export async function updateBand(band: BandInfo): Promise<void> {
  const { error } = await supabase
    .from("band_info")
    .update({
      booking_email: band.bookingEmail,
      telegram_channel: band.telegramChannel,
      social: band.social,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw error;
}
