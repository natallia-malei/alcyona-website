import { createContext, useCallback, useState, type ReactNode } from "react";
import type { BandInfo, Photo, Release, Video } from "../types";
import {
  getBand as readBand,
  getPhotos as readPhotos,
  getReleases as readReleases,
  getVideos as readVideos,
  resetAll as resetStorage,
  saveBand as writeBand,
  savePhotos as writePhotos,
  saveReleases as writeReleases,
  saveVideos as writeVideos,
} from "./index";

interface StorageContextValue {
  releases: Release[];
  photos: Photo[];
  videos: Video[];
  band: BandInfo;
  saveReleases: (releases: Release[]) => void;
  savePhotos: (photos: Photo[]) => void;
  saveVideos: (videos: Video[]) => void;
  saveBand: (band: BandInfo) => void;
  resetAll: () => void;
}

export const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [releases, setReleases] = useState<Release[]>(readReleases);
  const [photos, setPhotos] = useState<Photo[]>(readPhotos);
  const [videos, setVideos] = useState<Video[]>(readVideos);
  const [band, setBand] = useState<BandInfo>(readBand);

  const saveReleases = useCallback((next: Release[]) => {
    writeReleases(next);
    setReleases(next);
  }, []);

  const savePhotos = useCallback((next: Photo[]) => {
    writePhotos(next);
    setPhotos(next);
  }, []);

  const saveVideos = useCallback((next: Video[]) => {
    writeVideos(next);
    setVideos(next);
  }, []);

  const saveBand = useCallback((next: BandInfo) => {
    writeBand(next);
    setBand(next);
  }, []);

  const resetAll = useCallback(() => {
    resetStorage();
    setReleases(readReleases());
    setPhotos(readPhotos());
    setVideos(readVideos());
    setBand(readBand());
  }, []);

  return (
    <StorageContext.Provider
      value={{
        releases,
        photos,
        videos,
        band,
        saveReleases,
        savePhotos,
        saveVideos,
        saveBand,
        resetAll,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}
