import { useTranslation } from "react-i18next";
import type { CalendarBooking } from "../../types";
import {
  bookingTitle,
  formatTimeRange,
  getDaySlots,
  hourStart,
  type DayKey,
  type HourSlot,
  type HourState,
  type SlotContext,
} from "../../utils/studioTime";
import { slotStyles, unavailableLabel } from "./slotStyles";
import { typography } from "../../styles/typography";

interface DayHoursProps {
  day: DayKey;
  ctx: SlotContext;
  onPick: (slot: HourSlot) => void;
}

// Bookings and runs of past hours are rows; the hours you can start from
// (and the too-short ones between them) are a grid of chips
type Row =
  | { kind: "booking"; booking: CalendarBooking; mine: boolean }
  | { kind: "unavailable"; state: HourState; first: HourSlot; last: HourSlot }
  | { kind: "hours"; slots: HourSlot[] };

const isChip = (slot: HourSlot) => slot.state === "free" || slot.state === "too_short";

function toRows(slots: HourSlot[]): Row[] {
  const rows: Row[] = [];
  for (const slot of slots) {
    const prev = rows.at(-1);
    if (slot.booking) {
      if (prev?.kind === "booking" && prev.booking.id === slot.booking.id) continue;
      rows.push({ kind: "booking", booking: slot.booking, mine: slot.state === "mine" });
    } else if (isChip(slot)) {
      if (prev?.kind === "hours") prev.slots.push(slot);
      else rows.push({ kind: "hours", slots: [slot] });
    } else if (prev?.kind === "unavailable" && prev.state === slot.state) {
      prev.last = slot;
    } else {
      rows.push({ kind: "unavailable", state: slot.state, first: slot, last: slot });
    }
  }
  return rows;
}

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const rowBase = "flex items-center gap-4 w-full min-h-12 px-4 py-2 rounded-sm text-left";
const timeCol = "w-24 shrink-0 text-sm tabular-nums";
const chipBase = "flex items-center justify-center min-h-11 rounded-sm text-sm tabular-nums";

// Phone: the selected day's hours
export function DayHours({ day, ctx, onPick }: DayHoursProps) {
  const { t } = useTranslation();
  const slots = getDaySlots(day, ctx);
  const rows = toRows(slots);
  const hasFree = slots.some((s) => s.state === "free");
  const hasTooShort = slots.some((s) => s.state === "too_short");
  const minHours = { count: ctx.settings.minBookingHours };

  return (
    <div className="space-y-3">
      <p className={typography.caption}>
        {t(hasFree ? "studio.calendar.pickStart" : "studio.calendar.noFreeHours")}
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          if (row.kind === "booking") {
            const { booking } = row;
            const pending = booking.status === "pending";
            const style = row.mine
              ? pending
                ? slotStyles.minePending
                : slotStyles.mineConfirmed
              : pending
                ? slotStyles.busyPending
                : slotStyles.busy;
            return (
              <li key={booking.id} className={`${rowBase} ${style}`}>
                <span className={timeCol}>{formatTimeRange(booking.startsAt, booking.endsAt)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm truncate">{bookingTitle(booking, t)}</span>
                  {/* status / purpose come only for the author and admin (get_calendar decides) */}
                  {booking.status && (
                    <span className={`block ${typography.eyebrowXs} text-[10px] text-accent`}>
                      {t(`studio.status.${booking.status}`)}
                    </span>
                  )}
                  {booking.purpose && (
                    <span className="block text-xs text-fg-muted truncate">{booking.purpose}</span>
                  )}
                </span>
              </li>
            );
          }

          if (row.kind === "hours") {
            return (
              <li key={`hours-${row.slots[0].hour}`} className="grid grid-cols-4 gap-2">
                {row.slots.map((slot) =>
                  slot.state === "free" ? (
                    <button
                      key={slot.hour}
                      type="button"
                      onClick={() => onPick(slot)}
                      aria-label={`${t("studio.calendar.free")}: ${hourLabel(slot.hour)}`}
                      className={`${chipBase} ${slotStyles.free}`}
                    >
                      {hourLabel(slot.hour)}
                    </button>
                  ) : (
                    <span key={slot.hour} className={`${chipBase} ${slotStyles.unavailable}`}>
                      {hourLabel(slot.hour)}
                      <span className="sr-only">: {t("studio.calendar.tooShort", minHours)}</span>
                    </span>
                  ),
                )}
              </li>
            );
          }

          const { first, last, state } = row;
          const label = unavailableLabel[state];
          return (
            <li key={first.hour} className={`${rowBase} ${slotStyles.unavailable}`}>
              <span className={timeCol}>
                {first === last
                  ? hourLabel(first.hour)
                  : formatTimeRange(first.startsAt, hourStart(day, last.hour + 1))}
              </span>
              {label && <span className="text-sm">{t(label, minHours)}</span>}
            </li>
          );
        })}
      </ul>
      {hasTooShort && (
        <p className={typography.caption}>{t("studio.calendar.hatchedHint", minHours)}</p>
      )}
    </div>
  );
}
