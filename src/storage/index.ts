import type { BandInfo, Photo, Release, Video } from "../types";
import { seedBand, seedPhotos, seedReleases, seedVideos } from "../data/seed";

const KEY = {
  releases: "alcyona:releases",
  photos: "alcyona:photos",
  videos: "alcyona:videos",
  band: "alcyona:band",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getReleases(): Release[] {
  return read<Release[]>(KEY.releases, seedReleases);
}

export function saveReleases(releases: Release[]): void {
  write(KEY.releases, releases);
}

export function getReleaseById(id: string): Release | undefined {
  return getReleases().find((r) => r.id === id);
}

export function getFeaturedRelease(): Release | undefined {
  const list = getReleases();
  return list.find((r) => r.isFeatured) ?? list[0];
}

export function getPhotos(): Photo[] {
  return read<Photo[]>(KEY.photos, seedPhotos);
}

export function savePhotos(photos: Photo[]): void {
  write(KEY.photos, photos);
}

export function getVideos(): Video[] {
  return read<Video[]>(KEY.videos, seedVideos);
}

export function saveVideos(videos: Video[]): void {
  write(KEY.videos, videos);
}

export function getBand(): BandInfo {
  return read<BandInfo>(KEY.band, seedBand);
}

export function saveBand(band: BandInfo): void {
  write(KEY.band, band);
}

export function resetAll(): void {
  Object.values(KEY).forEach((k) => localStorage.removeItem(k));
}
