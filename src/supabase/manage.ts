import type {
  AdminBooking,
  AdminBookingTarget,
  BookingKind,
  BookingStatus,
  StudioClient,
  StudioSettings,
  UserRole,
} from "../types";
import { supabase } from "./client";
import { BookingError, rowToSettings, SETTINGS_COLUMNS, toBookingError } from "./bookings";
import type { SettingsRow } from "./bookings";

// Admin side of the studio calendar (/studio/manage, migration 015).
// Reads go straight to the tables (RLS lets the admin read everything),
// every change goes through a SECURITY DEFINER function that checks is_admin().
// Errors come as BookingError — show them with t(bookingErrorKey(e)).

export { cancelBooking } from "./bookings"; // admin may cancel any booking, any time

// How far back the "mark attendance" list looks
const ATTENDANCE_LOOKBACK_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ClientRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  role: UserRole;
  trusted: boolean;
  no_show_count: number;
  blocked: boolean;
}

interface AdminBookingRow {
  id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  expires_at: string | null;
  purpose: string | null;
  attended: boolean | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  label: string | null;
  created_at: string;
  client: ClientRow | null;
}

interface StudioClientRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  email: string | null;
  role: UserRole;
  trusted: boolean;
  blocked: boolean;
  no_show_count: number;
  created_at: string;
  upcoming_count: number;
  attended_count: number;
  last_visit_at: string | null;
}

// bookings has two FKs to profiles (user_id, created_by) — name the one we want
const ADMIN_BOOKING_COLUMNS =
  "id, starts_at, ends_at, status, expires_at, purpose, attended, user_id, guest_name, guest_phone, label, created_at, " +
  "client:profiles!bookings_user_id_fkey(id, first_name, last_name, phone, telegram_username, role, trusted, no_show_count, blocked)";

function kindOf(row: AdminBookingRow): BookingKind {
  if (row.label !== null) return "admin";
  if (row.guest_name !== null) return "guest";
  if (row.user_id === null) return "deleted";
  return "client";
}

function rowToAdminBooking(row: AdminBookingRow): AdminBooking {
  return {
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    purpose: row.purpose ?? "",
    attended: row.attended,
    kind: kindOf(row),
    client: row.client
      ? {
          id: row.client.id,
          firstName: row.client.first_name ?? "",
          lastName: row.client.last_name ?? "",
          phone: row.client.phone ?? "",
          telegramUsername: row.client.telegram_username ?? "",
          role: row.client.role,
          trusted: row.client.trusted,
          noShowCount: row.client.no_show_count,
          blocked: row.client.blocked,
        }
      : null,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    label: row.label,
    createdAt: new Date(row.created_at),
  };
}

function rowToStudioClient(row: StudioClientRow): StudioClient {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    telegramUsername: row.telegram_username ?? "",
    email: row.email ?? "",
    role: row.role,
    trusted: row.trusted,
    blocked: row.blocked,
    noShowCount: row.no_show_count,
    createdAt: new Date(row.created_at),
    upcomingCount: row.upcoming_count,
    attendedCount: row.attended_count,
    lastVisitAt: row.last_visit_at ? new Date(row.last_visit_at) : null,
  };
}

// Active = confirmed, or a request that hasn't expired yet (expiry is lazy in the DB)
function activeFilter(now: Date): string {
  return `status.eq.confirmed,and(status.eq.pending,expires_at.gt.${now.toISOString()})`;
}

// ----- Reads -----

// Active bookings overlapping [from, to) — past ones too (for attendance). No range limit.
export async function fetchAdminBookings(from: Date, to: Date): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_COLUMNS)
    .or(activeFilter(new Date()))
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString())
    .order("starts_at");

  if (error) throw error;
  return (data as unknown as AdminBookingRow[]).map(rowToAdminBooking);
}

// Requests awaiting review, the ones about to expire first
export async function fetchPendingRequests(): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_COLUMNS)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at");

  if (error) throw error;
  return (data as unknown as AdminBookingRow[]).map(rowToAdminBooking);
}

// Finished bookings of registered clients without an attendance mark, newest first.
// The admin's own bookings are left out: attendance only matters for clients' trust.
export async function fetchUnmarkedAttendance(): Promise<AdminBooking[]> {
  const now = new Date();
  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_COLUMNS)
    .eq("status", "confirmed")
    .is("attended", null)
    .not("user_id", "is", null)
    .lte("ends_at", now.toISOString())
    .gte("starts_at", new Date(now.getTime() - ATTENDANCE_LOOKBACK_DAYS * DAY_MS).toISOString())
    .order("starts_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as AdminBookingRow[])
    .map(rowToAdminBooking)
    .filter((b) => b.client?.role !== "admin");
}

// Every booking of one client (any status), newest first
export async function fetchClientBookings(userId: string): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_COLUMNS)
    .eq("user_id", userId)
    .order("starts_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data as unknown as AdminBookingRow[]).map(rowToAdminBooking);
}

// Everyone with an account (admins included, see role), sorted by last name
export async function fetchClients(): Promise<StudioClient[]> {
  const { data, error } = await supabase.rpc("get_clients");
  if (error) throw toBookingError(error);
  return (data as StudioClientRow[]).map(rowToStudioClient);
}

// ----- Changes -----

export async function approveBooking(id: string): Promise<void> {
  const { error } = await supabase.rpc("approve_booking", { p_id: id });
  if (error) throw toBookingError(error);
}

export async function rejectBooking(id: string): Promise<void> {
  const { error } = await supabase.rpc("reject_booking", { p_id: id });
  if (error) throw toBookingError(error);
}

// Always confirmed; no limits except "no overlap" (slot_taken). Purpose is optional.
export async function adminCreateBooking(
  target: AdminBookingTarget,
  startsAt: Date,
  hours: number,
  purpose: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_create_booking", {
    p_kind: target.kind,
    p_starts_at: startsAt.toISOString(),
    p_hours: hours,
    p_user_id: target.kind === "client" ? target.userId : null,
    p_guest_name: target.kind === "guest" ? target.name : null,
    p_guest_phone: target.kind === "guest" ? target.phone : null,
    p_label: target.kind === "block" ? target.label : null,
    p_purpose: purpose,
  });
  if (error) throw toBookingError(error);
}

// true = came, false = no-show, null = clear. Trust / no-show counter update in the DB.
export async function markAttendance(id: string, attended: boolean | null): Promise<void> {
  const { error } = await supabase.rpc("mark_attendance", { p_id: id, p_attended: attended });
  if (error) throw toBookingError(error);
}

// Returning trust resets the no-show counter
export async function setClientTrusted(userId: string, trusted: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_client_trusted", {
    p_user_id: userId,
    p_trusted: trusted,
  });
  if (error) throw toBookingError(error);
}

// Blocking cancels the client's future bookings and requests; returns how many
export async function setClientBlocked(userId: string, blocked: boolean): Promise<number> {
  const { data, error } = await supabase.rpc("set_client_blocked", {
    p_user_id: userId,
    p_blocked: blocked,
  });
  if (error) throw toBookingError(error);
  return data as number;
}

// Direct update (RLS: admin only). A CHECK violation (23514) → invalid_settings.
export async function updateStudioSettings(settings: StudioSettings): Promise<StudioSettings> {
  const { data, error } = await supabase
    .from("studio_settings")
    .update({
      open_hour: settings.openHour,
      close_hour: settings.closeHour,
      min_booking_hours: settings.minBookingHours,
      max_booking_hours: settings.maxBookingHours,
      booking_horizon_weeks: settings.bookingHorizonWeeks,
      max_active_bookings: settings.maxActiveBookings,
      request_ttl_hours: settings.requestTtlHours,
      request_cutoff_hours: settings.requestCutoffHours,
      free_cancel_hours: settings.freeCancelHours,
      no_show_limit: settings.noShowLimit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23514") throw new BookingError("invalid_settings");
    throw error;
  }
  return rowToSettings(data as SettingsRow);
}
