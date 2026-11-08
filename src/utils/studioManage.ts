import type { TFunction } from "i18next";
import type { AdminBooking, CalendarBooking, StudioClient } from "../types";

// Display helpers for /studio/manage, shared by all its tabs.

// "First Last", or "No name" while the profile isn't filled in
export function personName(
  person: { firstName: string; lastName: string } | null,
  t: TFunction,
): string {
  const name = person ? `${person.firstName} ${person.lastName}`.trim() : "";
  return name || t("studio.manage.noName");
}

// What the admin calls a booking: client / guest name, caption, "Busy" or "Deleted user"
export function adminBookingTitle(b: AdminBooking, t: TFunction): string {
  switch (b.kind) {
    case "client":
      return personName(b.client, t);
    case "guest":
      return b.guestName ?? "";
    case "admin":
      return b.label || t("studio.calendar.busy");
    case "deleted":
      return t("studio.calendar.deletedUser");
  }
}

// Phone to call about the booking (client's or guest's), "" if none
export function adminBookingPhone(b: AdminBooking): string {
  return b.client?.phone ?? b.guestPhone ?? "";
}

// The client's trust status as a badge key under studio.manage.badge.*
export function clientBadge(
  c: Pick<StudioClient, "role" | "trusted" | "blocked">,
): "admin" | "blocked" | "trusted" | "newbie" {
  if (c.role === "admin") return "admin";
  if (c.blocked) return "blocked";
  return c.trusted ? "trusted" : "newbie";
}

// AdminBooking → the shape WeekGrid / DayHours render (title "" → "Busy")
export function toCalendarBooking(b: AdminBooking, t: TFunction): CalendarBooking {
  return {
    id: b.id,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    kind: b.kind,
    title: b.kind === "admin" ? b.label : adminBookingTitle(b, t),
    isMine: false,
    status: b.status === "pending" || b.status === "confirmed" ? b.status : null,
    purpose: b.purpose || null,
  };
}

// Search across name, phone, email and Telegram, case-insensitive
export function matchesClient(c: StudioClient, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const haystack = [c.firstName, c.lastName, c.email, c.telegramUsername].join(" ").toLowerCase();
  return (
    haystack.includes(q) ||
    `${c.lastName} ${c.firstName}`.toLowerCase().includes(q) ||
    (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits))
  );
}
