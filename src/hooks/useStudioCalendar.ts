import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarBooking, MyBooking, StudioSettings } from "../types";
import { useAuthActions, useProfile, useSession } from "../auth/hooks";
import { fetchCalendar, fetchMyBookings, fetchStudioSettings } from "../supabase/bookings";
import {
  addDays,
  dayKeyOf,
  hourStart,
  weekStartOf,
  type DayKey,
  type SlotContext,
  type Viewer,
} from "../utils/studioTime";

const MAX_RANGE_DAYS = 62; // get_calendar limit

interface CalendarData {
  settings: StudioSettings;
  bookings: CalendarBooking[];
  myBookings: MyBooking[];
  now: Date;
  from: DayKey; // first loaded day (Monday of the current week)
  to: DayKey; // first day after the loaded range
}

export interface StudioCalendar {
  data: CalendarData | null; // null until the first load
  error: unknown;
  viewer: Viewer;
  // Everything getHourSlot / availableDurations need; null until loaded
  slotContext: SlotContext | null;
  refresh: () => Promise<void>;
}

// From Monday of this week to the end of the week where the booking horizon
// ends — both views fit: 28-day strip and week grid with arrows.
async function loadCalendar(userId: string | null): Promise<CalendarData> {
  const settings = await fetchStudioSettings();
  const now = new Date();
  const from = weekStartOf(dayKeyOf(now));
  const horizonEnd = addDays(dayKeyOf(now), settings.bookingHorizonWeeks * 7);
  const weeksEnd = addDays(weekStartOf(addDays(horizonEnd, -1)), 7);
  const maxEnd = addDays(from, MAX_RANGE_DAYS);
  const to = weeksEnd < maxEnd ? weeksEnd : maxEnd;

  const [bookings, myBookings] = await Promise.all([
    fetchCalendar(hourStart(from, 0), hourStart(to, 0)),
    userId ? fetchMyBookings(userId) : Promise.resolve([]),
  ]);
  return { settings, bookings, myBookings, now, from, to };
}

// No realtime: reloads after each action (call refresh) and when the tab gets focus.
export function useStudioCalendar(): StudioCalendar {
  const session = useSession();
  const profile = useProfile();
  const { refreshProfile } = useAuthActions();
  const userId = session?.user.id ?? null;

  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const requestId = useRef(0);

  const refresh = useCallback(() => {
    const id = ++requestId.current;
    // A newer refresh started meanwhile (e.g. sign-in) — only its result counts
    return loadCalendar(userId).then(
      (next) => {
        if (id !== requestId.current) return;
        setData(next);
        setError(null);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        console.error("Failed to load studio calendar", e);
        setError(e);
      },
    );
  }, [userId]);

  useEffect(() => {
    void refresh();
    // Admin may have changed trust / block meanwhile — re-read the profile too
    const onFocus = () => {
      void refresh();
      refreshProfile().catch((e: unknown) => console.error("Failed to refresh profile", e));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, refreshProfile]);

  // Memoized so components can safely use them in useMemo / useEffect deps
  const isAdmin = profile?.role === "admin";
  const trusted = profile?.trusted ?? false;
  const viewer = useMemo<Viewer>(() => ({ isAdmin, trusted }), [isAdmin, trusted]);

  const slotContext = useMemo<SlotContext | null>(
    () =>
      data ? { bookings: data.bookings, settings: data.settings, now: data.now, viewer } : null,
    [data, viewer],
  );

  return { data, error, viewer, slotContext, refresh };
}
