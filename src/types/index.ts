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

export type ConcertStatus = "announced" | "on_sale" | "sold_out" | "cancelled";

export interface Concert {
  id: string;
  /** Дата концерта, «2026-11-15» */
  date: string;
  /** Время начала, «19:00»; пусто — не объявлено */
  time: string;
  city: LocalizedText;
  venue: string;
  status: ConcertStatus;
  ticketUrl: string;
  vipUrl: string;
  /** Видео с концерта — для архива */
  videoUrl: string;
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

export type UserRole = "client" | "admin";

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramUsername: string;
  showFullName: boolean;
  role: UserRole;
  trusted: boolean;
  noShowCount: number;
  blocked: boolean;
  privacyConsentAt: string | null; // ISO date; null = no consent to data processing yet
}

// Fields the user fills in themselves (onboarding / profile form)
export type ProfileInput = Pick<
  Profile,
  "firstName" | "lastName" | "phone" | "telegramUsername" | "showFullName" | "privacyConsentAt"
>;

// ----- Studio bookings (012) -----

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "rejected" | "expired";

// Whose booking it is; null for guests (not signed in) — they see only "Busy"
export type BookingKind = "client" | "guest" | "admin" | "deleted";

// An active booking as the calendar shows it (get_calendar).
// title / status / purpose are null when the viewer may not see them.
export interface CalendarBooking {
  id: string;
  startsAt: Date;
  endsAt: Date;
  kind: BookingKind | null;
  title: string | null;
  isMine: boolean;
  status: "pending" | "confirmed" | null;
  purpose: string | null;
}

// The signed-in client's own booking ("My bookings")
export interface MyBooking {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  expiresAt: Date | null; // pending request turns into 'expired' at this moment
  purpose: string;
}

// Booking rules (single row, edited by admin in stage 3). Hours are Europe/Minsk.
export interface StudioSettings {
  openHour: number;
  closeHour: number; // 24 = until midnight
  minBookingHours: number;
  maxBookingHours: number;
  bookingHorizonWeeks: number;
  maxActiveBookings: number;
  requestTtlHours: number;
  requestCutoffHours: number;
  freeCancelHours: number;
  noShowLimit: number;
}
