import type { BandInfo, Photo, Release, Track, Video } from "../types";
import { supabase } from "./client";

interface ReleaseRow {
  id: string;
  title: Release["title"];
  type: Release["type"];
  release_date: string;
  cover_url: string;
  description: Release["description"];
  is_featured: boolean;
  links: Release["links"];
  tracks: TrackRow[];
}

interface TrackRow {
  id: string;
  release_id: string;
  position: number;
  title: Track["title"];
  duration_sec: number;
  lyrics: Track["lyrics"] | null;
}

interface PhotoRow {
  id: string;
  url: string;
  position: number;
}

interface VideoRow {
  id: string;
  youtube_id: string;
  title: Video["title"];
  position: number;
}

interface BandRow {
  booking_email: string;
  telegram_channel: string;
  social: BandInfo["social"];
}

function rowToTrack(row: TrackRow): Track {
  return {
    id: row.id,
    title: row.title,
    durationSec: row.duration_sec,
    lyrics: row.lyrics ?? { ru: "", en: "" },
  };
}

function rowToRelease(row: ReleaseRow): Release {
  const tracks = [...row.tracks].sort((a, b) => a.position - b.position).map(rowToTrack);
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    releaseDate: row.release_date,
    coverUrl: row.cover_url,
    description: row.description,
    isFeatured: row.is_featured,
    links: row.links,
    tracks,
  };
}

export async function fetchReleases(): Promise<Release[]> {
  const { data, error } = await supabase
    .from("releases")
    .select("*, tracks(*)")
    .order("release_date", { ascending: false });

  if (error) throw error;
  return (data as ReleaseRow[]).map(rowToRelease);
}

export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("id, url, position")
    .order("position");

  if (error) throw error;
  return (data as PhotoRow[]).map((row) => ({ id: row.id, url: row.url }));
}

export async function fetchVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id, youtube_id, title, position")
    .order("position");

  if (error) throw error;
  return (data as VideoRow[]).map((row) => ({
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
  }));
}

export async function fetchBand(): Promise<BandInfo> {
  const { data, error } = await supabase
    .from("band_info")
    .select("booking_email, telegram_channel, social")
    .eq("id", 1)
    .single();

  if (error) throw error;
  const row = data as BandRow;
  return {
    bookingEmail: row.booking_email,
    telegramChannel: row.telegram_channel,
    social: row.social,
  };
}
