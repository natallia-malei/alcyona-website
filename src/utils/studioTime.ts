import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { TZDate, tz } from "@date-fns/tz";
import type { TFunction } from "i18next";
import type { CalendarBooking, Locale, MyBooking, StudioSettings } from "../types";

// The studio works in Minsk time whatever the visitor's own time zone is.
// Minsk has no DST, so every day has exactly 24 hours.
export const STUDIO_TZ = "Europe/Minsk";
const inStudio = tz(STUDIO_TZ);

const HOUR_MS = 60 * 60 * 1000;
const DATE_LOCALES = { ru, en: enUS } as const;

// A calendar day in Minsk, "yyyy-MM-dd". A string, not a Date, so it can be
// compared, used as a React key and never shifts with the browser's time zone.
export type DayKey = string;

// ----- Days -----

export function dayKeyOf(date: Date): DayKey {
  return format(date, "yyyy-MM-dd", { in: inStudio });
}

export function hourOf(date: Date): number {
  return Number(format(date, "H", { in: inStudio }));
}

// Pure calendar arithmetic on the "yyyy-MM-dd" string (time zone doesn't matter here)
export function addDays(day: DayKey, n: number): DayKey {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Monday of the week the day belongs to
export function weekStartOf(day: DayKey): DayKey {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7));
}

export function daysFrom(start: DayKey, count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

// The moment `hour`:00 of `day` starts in Minsk; hour 24 = next day's midnight
export function hourStart(day: DayKey, hour: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, hour, 0, 0, STUDIO_TZ).getTime());
}

// Days a client can book: today + (weeks × 7 − 1) days (same rule as create_booking)
export function bookableDays(today: DayKey, settings: StudioSettings): DayKey[] {
  return daysFrom(today, settings.bookingHorizonWeeks * 7);
}

// Hours shown in the calendar: open_hour … close_hour − 1 (each is a 1-hour row)
export function dayHours(settings: StudioSettings): number[] {
  return Array.from(
    { length: settings.closeHour - settings.openHour },
    (_, i) => settings.openHour + i,
  );
}

// ----- Formatting (always in Minsk time) -----

// date-fns pattern, e.g. "EEEEEE d" → "пн 3", "HH:mm" → "10:00"
export function formatStudio(date: Date, pattern: string, locale: Locale): string {
  return format(date, pattern, { in: inStudio, locale: DATE_LOCALES[locale] });
}

export function formatDay(day: DayKey, pattern: string, locale: Locale): string {
  return formatStudio(hourStart(day, 12), pattern, locale);
}

// "10:00–12:00"; the end of a booking until midnight shows as "24:00"
export function formatTimeRange(startsAt: Date, endsAt: Date): string {
  const end =
    hourOf(endsAt) === 0 && endsAt > startsAt ? "24:00" : format(endsAt, "HH:mm", { in: inStudio });
  // Word joiners (U+2060) keep "10:00–12:00" on one line when text wraps
  return `${format(startsAt, "HH:mm", { in: inStudio })}\u2060–\u2060${end}`;
}

// ----- Hour states -----

// What the viewer is allowed to do — rules differ for admin and trusted clients
export interface Viewer {
  isAdmin: boolean;
  trusted: boolean;
}

// free           — can start a booking here
// busy / mine    — covered by someone else's / the viewer's booking (`booking` is set)
// past           — too late to start here: already started, or (for a request)
//                  closer than request_cutoff_hours, so it would expire at once
// too_short      — free, but fewer than min_booking_hours free in a row after it
// beyond_horizon — later than the booking horizon
export type HourState = "free" | "busy" | "mine" | "past" | "too_short" | "beyond_horizon";

export interface HourSlot {
  day: DayKey;
  hour: number;
  startsAt: Date;
  state: HourState;
  booking: CalendarBooking | null;
}

export interface SlotContext {
  bookings: CalendarBooking[];
  settings: StudioSettings;
  now: Date;
  viewer: Viewer;
}

function bookingAt(bookings: CalendarBooking[], from: Date, to: Date): CalendarBooking | null {
  return bookings.find((b) => b.startsAt < to && b.endsAt > from) ?? null;
}

// Earliest start the viewer may pick: a newbie's request needs time to be reviewed
function earliestStart({ now, settings, viewer }: SlotContext): Date {
  const needsReview = !viewer.isAdmin && !viewer.trusted;
  return needsReview ? new Date(now.getTime() + settings.requestCutoffHours * HOUR_MS) : now;
}

// Booking lengths (in hours) that fit from this hour: no overlap, end by close_hour.
// Admin has no min/max — from 1 hour up to the next booking or closing time.
export function availableDurations(day: DayKey, hour: number, ctx: SlotContext): number[] {
  const { settings, viewer, bookings } = ctx;
  const min = viewer.isAdmin ? 1 : settings.minBookingHours;
  const max = viewer.isAdmin ? settings.closeHour - hour : settings.maxBookingHours;
  const start = hourStart(day, hour);
  const result: number[] = [];

  for (let h = 1; h <= max && hour + h <= settings.closeHour; h++) {
    const end = new Date(start.getTime() + h * HOUR_MS);
    if (bookingAt(bookings, start, end)) break;
    if (h >= min) result.push(h);
  }
  return result;
}

export function getHourSlot(day: DayKey, hour: number, ctx: SlotContext): HourSlot {
  const startsAt = hourStart(day, hour);
  const slot = { day, hour, startsAt };

  const booking = bookingAt(ctx.bookings, startsAt, new Date(startsAt.getTime() + HOUR_MS));
  if (booking) return { ...slot, state: booking.isMine ? "mine" : "busy", booking };

  const horizonEnd = addDays(dayKeyOf(ctx.now), ctx.settings.bookingHorizonWeeks * 7);
  let state: HourState = "free";
  if (startsAt <= earliestStart(ctx)) state = "past";
  else if (!ctx.viewer.isAdmin && day >= horizonEnd) state = "beyond_horizon";
  else if (availableDurations(day, hour, ctx).length === 0) state = "too_short";

  return { ...slot, state, booking: null };
}

export function getDaySlots(day: DayKey, ctx: SlotContext): HourSlot[] {
  return dayHours(ctx.settings).map((hour) => getHourSlot(day, hour, ctx));
}

// What the calendar writes on a booking block
export function bookingTitle(booking: CalendarBooking, t: TFunction): string {
  if (booking.title) return booking.title;
  return booking.kind === "deleted" ? t("studio.calendar.deletedUser") : t("studio.calendar.busy");
}

// ----- My bookings -----

// Requests expire lazily in the DB: an overdue 'pending' row is already expired
export function effectiveStatus(booking: MyBooking, now: Date): MyBooking["status"] {
  return booking.status === "pending" && booking.expiresAt && booking.expiresAt <= now
    ? "expired"
    : booking.status;
}

// withdraw  — pending request, can be withdrawn any time
// cancel    — confirmed, ≥ free_cancel_hours before the start
// via_admin — confirmed, too late to cancel on the site
// null      — nothing to do (started, rejected, expired…)
export type CancelOption = "withdraw" | "cancel" | "via_admin" | null;

export function cancelOption(
  booking: MyBooking,
  settings: StudioSettings,
  now: Date,
  isAdmin: boolean,
): CancelOption {
  if (booking.startsAt <= now) return null;
  const status = effectiveStatus(booking, now);
  if (status === "pending") return "withdraw";
  if (status !== "confirmed") return null;
  const deadline = booking.startsAt.getTime() - settings.freeCancelHours * HOUR_MS;
  return isAdmin || now.getTime() <= deadline ? "cancel" : "via_admin";
}
