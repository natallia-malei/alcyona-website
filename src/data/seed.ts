import type { BandInfo, Photo, Release, Video } from "../types";

export const seedBand: BandInfo = {
  bookingEmail: "alcyona@gmail.com",
  telegramChannel: "https://t.me/alcyona",
  social: {
    instagram: "https://instagram.com/alcyona",
    youtube: "https://youtube.com/@alcyona",
    vk: "https://vk.com/alcyona",
    telegram: "https://t.me/alcyona",
  },
};

export const seedReleases: Release[] = [
  {
    id: "starfall",
    title: { ru: "Звездопад", en: "Starfall" },
    type: "album",
    releaseDate: "2026-05-01",
    coverUrl:
      "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=900&q=80",
    description: {
      ru: "Дебютный альбом ALCYONA — путешествие сквозь свет и тьму.",
      en: "ALCYONA's debut album — a journey through light and darkness.",
    },
    isFeatured: true,
    links: {
      spotify: "https://open.spotify.com/",
      appleMusic: "https://music.apple.com/",
      youtube: "https://youtube.com/",
    },
    tracks: [
      {
        id: "starfall-1",
        title: { ru: "Пролог", en: "Prologue" },
        durationSec: 92,
        lyrics: {
          ru: "Здесь начнётся история...",
          en: "Here the story begins...",
        },
      },
      {
        id: "starfall-2",
        title: { ru: "Звездопад", en: "Starfall" },
        durationSec: 261,
        lyrics: {
          ru: "Падают звёзды в тёмный лес,\nИ снова всё с начала.",
          en: "Stars are falling into the dark forest,\nAnd everything starts again.",
        },
      },
    ],
  },
  {
    id: "echoes",
    title: { ru: "Эхо", en: "Echoes" },
    type: "single",
    releaseDate: "2025-11-12",
    coverUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
    description: {
      ru: "Сингл, открывший новую главу звучания группы.",
      en: "The single that opened a new chapter in the band's sound.",
    },
    links: { spotify: "https://open.spotify.com/" },
    tracks: [
      {
        id: "echoes-1",
        title: { ru: "Эхо", en: "Echoes" },
        durationSec: 224,
        lyrics: { ru: "Эхо в горах...", en: "Echoes in the mountains..." },
      },
    ],
  },
];

export const seedPhotos: Photo[] = [
  {
    id: "p1",
    url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&q=80",
  },
  {
    id: "p2",
    url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
  },
  {
    id: "p3",
    url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80",
  },
  {
    id: "p4",
    url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80",
  },
];

export const seedVideos: Video[] = [
  {
    id: "v1",
    youtubeId: "dQw4w9WgXcQ",
    title: { ru: "Live в клубе", en: "Live at the club" },
  },
  {
    id: "v2",
    youtubeId: "9bZkp7q19f0",
    title: { ru: "Backstage", en: "Backstage" },
  },
];
