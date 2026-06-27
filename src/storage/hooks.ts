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
  return useStorageContext().band;
}

export function useReleaseById(id: string | undefined): Release | undefined {
  const releases = useReleases();
  return useMemo(
    () => (id ? releases.find((r) => r.id === id) : undefined),
    [releases, id],
  );
}

export function useFeaturedRelease(): Release | undefined {
  const releases = useReleases();
  return useMemo(
    () => releases.find((r) => r.isFeatured) ?? releases[0],
    [releases],
  );
}

export function useStorageActions() {
  const ctx = useStorageContext();
  return {
    saveReleases: ctx.saveReleases,
    savePhotos: ctx.savePhotos,
    saveVideos: ctx.saveVideos,
    saveBand: ctx.saveBand,
    resetAll: ctx.resetAll,
  };
}
