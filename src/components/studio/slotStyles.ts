import type { BookingStatus } from "../../types";

// One visual language for the day list (phone) and the week grid (desktop).
// Accent (sky) = confirmed, amber = request awaiting the admin.
export const slotStyles = {
  free: "border border-white/10 text-fg-muted hover:border-accent hover:bg-accent/10 hover:text-white transition-colors cursor-pointer",
  // Diagonal hatching: reads as "can't book" without looking like a booking
  unavailable:
    "border border-white/5 text-fg-muted/60 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.05)_0_4px,transparent_4px_10px)]",
  // Hover preview in the week grid: the hours a booking from here would take
  preview: "border border-accent bg-accent/15 text-white cursor-pointer",
  busy: "bg-white/5 border border-white/10 text-fg-muted",
  busyPending: "bg-white/5 border border-dashed border-amber-400/50 text-fg-muted", // admin sees others' requests
  mineConfirmed: "bg-accent/20 border-l-2 border-accent text-white",
  minePending: "bg-amber-400/10 border-l-2 border-dashed border-amber-400 text-white",
  // Just-created booking, for a few seconds after "Book"
  highlight: "ring-2 ring-white/80 shadow-[0_0_0_6px_rgb(14_165_233/0.35)]",
} as const;

// Status label colour, same meaning everywhere
export const statusTextClass: Record<BookingStatus, string> = {
  confirmed: "text-accent",
  pending: "text-amber-400",
  cancelled: "text-fg-muted",
  rejected: "text-red-400",
  expired: "text-fg-muted",
};
