export type Locale = "ru" | "en";

export type LocalizedText = Record<Locale, string>;

export interface Track {
  id: string;
  title: LocalizedText;
  durationSec: number;
  lyrics: LocalizedText;
}

export interface StreamingLinks {
  spotify?: string;
  appleMusic?: string;
  yandexMusic?: string;
  youtube?: string;
  vk?: string;
}

export interface Release {
  id: string;
  title: LocalizedText;
  type: "album" | "single" | "ep";
  releaseDate: string;
  coverUrl: string;
  description: LocalizedText;
  tracks: Track[];
  links: StreamingLinks;
  isFeatured?: boolean;
}

export interface Photo {
  id: string;
  url: string;
  caption?: LocalizedText;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: LocalizedText;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  vk?: string;
  telegram?: string;
}

export interface BandInfo {
  bookingEmail: string;
  telegramChannel: string;
  social: SocialLinks;
}
