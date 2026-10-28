import type { BandInfo, Photo, Profile, Release, Track, Video } from "../types";
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

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  show_full_name: boolean;
  role: Profile["role"];
  trusted: boolean;
  no_show_count: number;
  blocked: boolean;
  privacy_consent_at: string | null;
}

export const PROFILE_COLUMNS =
  "id, first_name, last_name, phone, telegram_username, show_full_name, role, trusted, no_show_count, blocked, privacy_consent_at";

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    telegramUsername: row.telegram_username ?? "",
    showFullName: row.show_full_name,
    role: row.role,
    trusted: row.trusted,
    noShowCount: row.no_show_count,
    blocked: row.blocked,
    privacyConsentAt: row.privacy_consent_at,
  };
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
    .order("position");

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

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}
