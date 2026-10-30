import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BandInfo, Concert, Photo, Release, Video } from "../types";
import { StorageContext, type StorageContextValue } from "./StorageContext";
import {
  fetchBand,
  fetchConcerts,
  fetchPhotos,
  fetchReleases,
  fetchVideos,
} from "../supabase/queries";
import {
  addPhoto as addPhotoMutation,
  addVideo as addVideoMutation,
  deleteConcert as deleteConcertMutation,
  deletePhoto as deletePhotoMutation,
  deleteRelease as deleteReleaseMutation,
  deleteVideo as deleteVideoMutation,
  updateBand as updateBandMutation,
  updatePhotoPositions as updatePhotoPositionsMutation,
  updateReleasePositions as updateReleasePositionsMutation,
  updateVideoPositions as updateVideoPositionsMutation,
  upsertConcert as upsertConcertMutation,
  upsertRelease as upsertReleaseMutation,
} from "../supabase/mutations";

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [band, setBand] = useState<BandInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs mirror state so mutation callbacks can read latest values without re-creating on each change
  const releasesRef = useRef<Release[]>(releases);
  const photosRef = useRef<Photo[]>(photos);
  const videosRef = useRef<Video[]>(videos);
  useEffect(() => {
    releasesRef.current = releases;
  }, [releases]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    Promise.all([fetchReleases(), fetchPhotos(), fetchVideos(), fetchBand(), fetchConcerts()])
      .then(([r, p, v, b, c]) => {
        setReleases(r);
        setPhotos(p);
        setVideos(v);
        setBand(b);
        setConcerts(c);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Unknown error");
      })
      .finally(() => setLoading(false));
  }, []);

  const upsertRelease = useCallback(async (release: Release) => {
    const existingIdx = releasesRef.current.findIndex((r) => r.id === release.id);
    const position = existingIdx === -1 ? releasesRef.current.length + 1 : existingIdx + 1;

    await upsertReleaseMutation(release, position);

    setReleases((prev) => {
      const idx = prev.findIndex((r) => r.id === release.id);
      if (idx === -1) return [...prev, release];
      const next = [...prev];
      next[idx] = release;
      return next;
    });
  }, []);

  const deleteRelease = useCallback(async (id: string) => {
    await deleteReleaseMutation(id);
    setReleases((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const reorderReleases = useCallback(async (next: Release[]) => {
    const previous = releasesRef.current;
    setReleases(next);
    try {
      await updateReleasePositionsMutation(next);
    } catch (err) {
      setReleases(previous);
      throw err;
    }
  }, []);

  const addPhoto = useCallback(async (url: string) => {
    const position = photosRef.current.length + 1;
    const created = await addPhotoMutation({ url }, position);
    setPhotos((prev) => [...prev, created]);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    await deletePhotoMutation(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorderPhotos = useCallback(async (next: Photo[]) => {
    const previous = photosRef.current;
    setPhotos(next);
    try {
      await updatePhotoPositionsMutation(next);
    } catch (err) {
      setPhotos(previous);
      throw err;
    }
  }, []);

  const addVideo = useCallback(async (youtubeId: string, title: Video["title"]) => {
    const position = videosRef.current.length + 1;
    const created = await addVideoMutation({ youtubeId, title }, position);
    setVideos((prev) => [...prev, created]);
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    await deleteVideoMutation(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const reorderVideos = useCallback(async (next: Video[]) => {
    const previous = videosRef.current;
    setVideos(next);
    try {
      await updateVideoPositionsMutation(next);
    } catch (err) {
      setVideos(previous);
      throw err;
    }
  }, []);

  const updateBand = useCallback(async (next: BandInfo) => {
    await updateBandMutation(next);
    setBand(next);
  }, []);

  const upsertConcert = useCallback(async (concert: Concert) => {
    const saved = await upsertConcertMutation(concert);
    setConcerts((prev) =>
      [...prev.filter((c) => c.id !== saved.id), saved].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    );
  }, []);

  const deleteConcert = useCallback(async (id: string) => {
    await deleteConcertMutation(id);
    setConcerts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo<StorageContextValue>(
    () => ({
      releases,
      photos,
      videos,
      concerts,
      band,
      loading,
      error,
      upsertRelease,
      deleteRelease,
      reorderReleases,
      addPhoto,
      deletePhoto,
      reorderPhotos,
      addVideo,
      deleteVideo,
      reorderVideos,
      updateBand,
      upsertConcert,
      deleteConcert,
    }),
    [
      releases,
      photos,
      videos,
      concerts,
      band,
      loading,
      error,
      upsertRelease,
      deleteRelease,
      reorderReleases,
      addPhoto,
      deletePhoto,
      reorderPhotos,
      addVideo,
      deleteVideo,
      reorderVideos,
      updateBand,
      upsertConcert,
      deleteConcert,
    ],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
