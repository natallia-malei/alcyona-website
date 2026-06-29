import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { BandInfo, Photo, Release, Video } from "../types";
import { fetchBand, fetchPhotos, fetchReleases, fetchVideos } from "../supabase/queries";
import {
  addPhoto as addPhotoMutation,
  addVideo as addVideoMutation,
  deletePhoto as deletePhotoMutation,
  deleteRelease as deleteReleaseMutation,
  deleteVideo as deleteVideoMutation,
  updateBand as updateBandMutation,
  updatePhotoPositions as updatePhotoPositionsMutation,
  upsertRelease as upsertReleaseMutation,
} from "../supabase/mutations";

interface StorageContextValue {
  releases: Release[];
  photos: Photo[];
  videos: Video[];
  band: BandInfo | null;
  loading: boolean;
  error: string | null;
  upsertRelease: (release: Release) => Promise<void>;
  deleteRelease: (id: string) => Promise<void>;
  addPhoto: (url: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  reorderPhotos: (photos: Photo[]) => Promise<void>;
  addVideo: (youtubeId: string, title: Video["title"]) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  updateBand: (band: BandInfo) => Promise<void>;
}

export const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [band, setBand] = useState<BandInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchReleases(), fetchPhotos(), fetchVideos(), fetchBand()])
      .then(([r, p, v, b]) => {
        setReleases(r);
        setPhotos(p);
        setVideos(v);
        setBand(b);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Unknown error");
      })
      .finally(() => setLoading(false));
  }, []);

  const upsertRelease = useCallback(async (release: Release) => {
    await upsertReleaseMutation(release);
    setReleases((prev) => {
      const idx = prev.findIndex((r) => r.id === release.id);
      if (idx === -1) return [release, ...prev];
      const next = [...prev];
      next[idx] = release;
      return next;
    });
  }, []);

  const deleteRelease = useCallback(async (id: string) => {
    await deleteReleaseMutation(id);
    setReleases((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addPhoto = useCallback(
    async (url: string) => {
      const created = await addPhotoMutation({ url }, photos.length + 1);
      setPhotos((prev) => [...prev, created]);
    },
    [photos.length],
  );

  const deletePhoto = useCallback(async (id: string) => {
    await deletePhotoMutation(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorderPhotos = useCallback(async (next: Photo[]) => {
    const previous = photos;
    setPhotos(next);
    try {
      await updatePhotoPositionsMutation(next);
    } catch (err) {
      setPhotos(previous);
      throw err;
    }
  }, [photos]);

  const addVideo = useCallback(
    async (youtubeId: string, title: Video["title"]) => {
      const created = await addVideoMutation({ youtubeId, title }, videos.length + 1);
      setVideos((prev) => [...prev, created]);
    },
    [videos.length],
  );

  const deleteVideo = useCallback(async (id: string) => {
    await deleteVideoMutation(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const updateBand = useCallback(async (next: BandInfo) => {
    await updateBandMutation(next);
    setBand(next);
  }, []);

  return (
    <StorageContext.Provider
      value={{
        releases,
        photos,
        videos,
        band,
        loading,
        error,
        upsertRelease,
        deleteRelease,
        addPhoto,
        deletePhoto,
        reorderPhotos,
        addVideo,
        deleteVideo,
        updateBand,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}
