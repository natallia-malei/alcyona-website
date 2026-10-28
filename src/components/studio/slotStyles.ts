import type { HourState } from "../../utils/studioTime";

// One visual language for the day list (phone) and the week grid (desktop)
export const slotStyles = {
  free: "border border-white/10 text-fg-muted hover:border-accent hover:bg-accent/10 hover:text-white transition-colors cursor-pointer",
  // Diagonal hatching: reads as "can't book" without looking like a booking
  unavailable:
    "border border-white/5 text-fg-muted/60 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.05)_0_4px,transparent_4px_10px)]",
  // Hover preview in the week grid: the hours a booking from here would take
  preview: "border border-accent bg-accent/15 text-white cursor-pointer",
  busy: "bg-white/5 border border-white/10 text-fg-muted",
  busyPending: "bg-white/5 border border-dashed border-white/30 text-fg-muted", // admin sees others' requests
  mineConfirmed: "bg-accent/20 border-l-2 border-accent text-white",
  minePending: "bg-accent/10 border-l-2 border-dashed border-accent text-white",
} as const;

// Hour states that can't be picked, with their i18n label
export const unavailableLabel: Partial<Record<HourState, string>> = {
  past: "studio.calendar.past",
  too_short: "studio.calendar.tooShort", // needs { count: settings.minBookingHours }
  beyond_horizon: "studio.calendar.beyondHorizon",
};
