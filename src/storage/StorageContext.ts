import { createContext } from "react";
import type { BandInfo, Concert, Photo, Release, Video } from "../types";

export interface StorageContextValue {
  releases: Release[];
  photos: Photo[];
  videos: Video[];
  concerts: Concert[];
  band: BandInfo | null;
  loading: boolean;
  error: string | null;
  upsertRelease: (release: Release) => Promise<void>;
  deleteRelease: (id: string) => Promise<void>;
  reorderReleases: (releases: Release[]) => Promise<void>;
  addPhoto: (url: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  reorderPhotos: (photos: Photo[]) => Promise<void>;
  addVideo: (youtubeId: string, title: Video["title"]) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  reorderVideos: (videos: Video[]) => Promise<void>;
  updateBand: (band: BandInfo) => Promise<void>;
  upsertConcert: (concert: Concert) => Promise<void>;
  deleteConcert: (id: string) => Promise<void>;
}

export const StorageContext = createContext<StorageContextValue | null>(null);
