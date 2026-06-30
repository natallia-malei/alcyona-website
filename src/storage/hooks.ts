import { useContext, useMemo } from "react";
import type { Release } from "../types";
import { StorageContext } from "./StorageContext";

function useStorageContext() {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("Storage hooks must be used within <StorageProvider>");
  }
  return ctx;
}

export function useReleases() {
  return useStorageContext().releases;
}

export function usePhotos() {
  return useStorageContext().photos;
}

export function useVideos() {
  return useStorageContext().videos;
}

export function useBand() {
  const band = useStorageContext().band;
  if (!band) {
    throw new Error("useBand called before storage loaded — ensure StorageProvider has finished loading");
  }
  return band;
}

export function useReleaseById(id: string | undefined): Release | undefined {
  const releases = useReleases();
  return useMemo(() => (id ? releases.find((r) => r.id === id) : undefined), [releases, id]);
}

export function useFeaturedRelease(): Release | undefined {
  const releases = useReleases();
  return useMemo(() => releases.find((r) => r.isFeatured) ?? releases[0], [releases]);
}

export function useStorageLoading(): boolean {
  return useStorageContext().loading;
}

export function useStorageError(): string | null {
  return useStorageContext().error;
}

export function useStorageActions() {
  const ctx = useStorageContext();
  return {
    upsertRelease: ctx.upsertRelease,
    deleteRelease: ctx.deleteRelease,
    addPhoto: ctx.addPhoto,
    deletePhoto: ctx.deletePhoto,
    reorderPhotos: ctx.reorderPhotos,
    addVideo: ctx.addVideo,
    deleteVideo: ctx.deleteVideo,
    reorderVideos: ctx.reorderVideos,
    updateBand: ctx.updateBand,
  };
}
