import type {
  BookingKind,
  BookingStatus,
  CalendarBooking,
  MyBooking,
  StudioSettings,
} from "../types";
import { supabase } from "./client";

// Error codes raised by create_booking / cancel_booking / get_calendar (012, 013).
// The UI shows them via t(`studio.errors.${code}`).
export const BOOKING_ERROR_CODES = [
  "not_authenticated",
  "profile_incomplete",
  "blocked",
  "consent_required",
  "invalid_duration",
  "invalid_start",
  "outside_hours",
  "in_the_past",
  "beyond_horizon",
  "purpose_required",
  "purpose_too_long",
  "limit_reached",
  "too_late_for_request",
  "slot_taken",
  "not_found",
  "not_active",
  "too_late_to_cancel",
  "invalid_range",
] as const;

export type BookingErrorCode = (typeof BOOKING_ERROR_CODES)[number];

export class BookingError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode) {
    super(code);
    this.name = "BookingError";
    this.code = code;
  }
}

function isBookingErrorCode(value: string): value is BookingErrorCode {
  return (BOOKING_ERROR_CODES as readonly string[]).includes(value);
}

// RAISE EXCEPTION 'slot_taken' arrives as { message: "slot_taken" }
function toBookingError(error: { message: string }): Error {
  return isBookingErrorCode(error.message) ? new BookingError(error.message) : (error as Error);
}

// i18n key for any error from this module
export function bookingErrorKey(e: unknown): string {
  return e instanceof BookingError ? `studio.errors.${e.code}` : "common.unknownError";
}

interface CalendarRow {
  id: string;
  starts_at: string;
  ends_at: string;
  kind: BookingKind | null;
  title: string | null;
  is_mine: boolean;
  status: CalendarBooking["status"];
  purpose: string | null;
}

interface BookingRow {
  id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  expires_at: string | null;
  purpose: string | null;
}

interface SettingsRow {
  open_hour: number;
  close_hour: number;
  min_booking_hours: number;
  max_booking_hours: number;
  booking_horizon_weeks: number;
  max_active_bookings: number;
  request_ttl_hours: number;
  request_cutoff_hours: number;
  free_cancel_hours: number;
  no_show_limit: number;
}

const BOOKING_COLUMNS = "id, starts_at, ends_at, status, expires_at, purpose";

function rowToMyBooking(row: BookingRow): MyBooking {
  return {
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    purpose: row.purpose ?? "",
  };
}

// Active bookings overlapping [from, to); the range may be at most 62 days
export async function fetchCalendar(from: Date, to: Date): Promise<CalendarBooking[]> {
  const { data, error } = await supabase.rpc("get_calendar", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) throw toBookingError(error);
  return (data as CalendarRow[]).map((row) => ({
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    kind: row.kind,
    title: row.title,
    isMine: row.is_mine,
    status: row.status,
    purpose: row.purpose,
  }));
}

// Upcoming bookings of this user (not yet ended), withdrawn/cancelled ones left out.
// Filtered by user_id explicitly: RLS lets admin read everyone's rows.
// A 'pending' row past its expires_at is shown as expired by the UI (lazy expiry).
export async function fetchMyBookings(userId: string): Promise<MyBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");

  if (error) throw error;
  return (data as BookingRow[]).map(rowToMyBooking);
}

export async function fetchStudioSettings(): Promise<StudioSettings> {
  const { data, error } = await supabase
    .from("studio_settings")
    .select(
      "open_hour, close_hour, min_booking_hours, max_booking_hours, booking_horizon_weeks, max_active_bookings, request_ttl_hours, request_cutoff_hours, free_cancel_hours, no_show_limit",
    )
    .eq("id", 1)
    .single();

  if (error) throw error;
  const row = data as SettingsRow;
  return {
    openHour: row.open_hour,
    closeHour: row.close_hour,
    minBookingHours: row.min_booking_hours,
    maxBookingHours: row.max_booking_hours,
    bookingHorizonWeeks: row.booking_horizon_weeks,
    maxActiveBookings: row.max_active_bookings,
    requestTtlHours: row.request_ttl_hours,
    requestCutoffHours: row.request_cutoff_hours,
    freeCancelHours: row.free_cancel_hours,
    noShowLimit: row.no_show_limit,
  };
}

// Returns the new booking: status 'confirmed' (trusted/admin) or 'pending' (request)
export async function createBooking(
  startsAt: Date,
  hours: number,
  purpose: string,
): Promise<MyBooking> {
  const { data, error } = await supabase.rpc("create_booking", {
    p_starts_at: startsAt.toISOString(),
    p_hours: hours,
    p_purpose: purpose,
  });

  if (error) throw toBookingError(error);
  return rowToMyBooking(data as BookingRow);
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_booking", { p_id: id });
  if (error) throw toBookingError(error);
}
