import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminBooking, StudioSettings } from "../../../types";
import { fetchStudioSettings } from "../../../supabase/bookings";
import { fetchAdminBookings } from "../../../supabase/manage";
import { addDays, hourStart, type DayKey } from "../../../utils/studioTime";

export interface AdminCalendarData {
  settings: StudioSettings;
  bookings: AdminBooking[];
  byId: Map<string, AdminBooking>;
  now: Date;
  weekStart: DayKey; // week these bookings belong to
}

export interface AdminCalendar {
  data: AdminCalendarData | null; // null until the first load
  error: unknown;
  reload: () => Promise<void>;
}

// One week of every active booking for the admin. Settings load once per mount
// (the Settings tab remounts this one). Reloads on week change and window focus.
export function useAdminCalendar(weekStart: DayKey): AdminCalendar {
  const [data, setData] = useState<Omit<AdminCalendarData, "byId"> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const settingsRef = useRef<StudioSettings | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(() => {
    const id = ++requestId.current;
    return Promise.all([
      settingsRef.current ?? fetchStudioSettings(),
      fetchAdminBookings(hourStart(weekStart, 0), hourStart(addDays(weekStart, 7), 0)),
    ]).then(
      ([settings, bookings]) => {
        settingsRef.current = settings;
        // A newer reload (e.g. another week) started meanwhile — only its result counts
        if (id !== requestId.current) return;
        setData({ settings, bookings, now: new Date(), weekStart });
        setError(null);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        console.error("Failed to load admin calendar", e);
        setError(e);
      },
    );
  }, [weekStart]);

  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  const full = useMemo<AdminCalendarData | null>(
    () => (data ? { ...data, byId: new Map(data.bookings.map((b) => [b.id, b])) } : null),
    [data],
  );

  return { data: full, error, reload };
}
