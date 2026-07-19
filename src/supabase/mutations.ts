import type { BandInfo, Photo, Release, Track, Video } from "../types";
import { supabase } from "./client";

// ----- Releases -----

export async function deleteRelease(id: string): Promise<void> {
  const { error } = await supabase.from("releases").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertRelease(release: Release, position: number): Promise<void> {
  const { error } = await supabase.from("releases").upsert({
    id: release.id,
    title: release.title,
    type: release.type,
    release_date: release.releaseDate,
    cover_url: release.coverUrl,
    description: release.description,
    is_featured: release.isFeatured ?? false,
    links: release.links,
    position,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  await syncTracks(release.id, release.tracks);
}

export async function updateReleasePositions(releases: Release[]): Promise<void> {
  const updates = releases.map((r, idx) =>
    supabase.from("releases").update({ position: idx + 1 }).eq("id", r.id),
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

// tracks are treated as a fully-owned child list of a release —
// simplest correct sync is delete-all + insert-fresh with new positions.
// Avoids the UNIQUE(release_id, position) constraint tripping on swaps.
async function syncTracks(releaseId: string, tracks: Track[]): Promise<void> {
  const { error: delError } = await supabase.from("tracks").delete().eq("release_id", releaseId);
  if (delError) throw delError;
  if (tracks.length === 0) return;

  const rows = tracks.map((t, i) => ({
    id: t.id,
    release_id: releaseId,
    position: i + 1,
    title: t.title,
    duration_sec: t.durationSec,
    lyrics: t.lyrics.ru.trim() || t.lyrics.en.trim() ? t.lyrics : null,
  }));

  const { error: insError } = await supabase.from("tracks").insert(rows);
  if (insError) throw insError;
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
