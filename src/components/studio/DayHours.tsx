import { useTranslation } from "react-i18next";
import type { CalendarBooking } from "../../types";
import {
  bookingTitle,
  formatStudio,
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

// Consecutive hours of one booking, or of one unavailable state, collapse into a single row
type Row =
  | { kind: "booking"; booking: CalendarBooking; mine: boolean }
  | { kind: "free"; slot: HourSlot }
  | { kind: "unavailable"; state: HourState; first: HourSlot; last: HourSlot };

function toRows(slots: HourSlot[]): Row[] {
  const rows: Row[] = [];
  for (const slot of slots) {
    const prev = rows.at(-1);
    if (slot.booking) {
      if (prev?.kind === "booking" && prev.booking.id === slot.booking.id) continue;
      rows.push({ kind: "booking", booking: slot.booking, mine: slot.state === "mine" });
    } else if (slot.state === "free") {
      rows.push({ kind: "free", slot });
    } else if (prev?.kind === "unavailable" && prev.state === slot.state) {
      prev.last = slot;
    } else {
      rows.push({ kind: "unavailable", state: slot.state, first: slot, last: slot });
    }
  }
  return rows;
}

const rowBase = "flex items-center gap-4 w-full min-h-12 px-4 py-2 rounded-sm text-left";
const timeCol = "w-24 shrink-0 text-sm tabular-nums";

// Phone: the selected day's hours as a vertical list
export function DayHours({ day, ctx, onPick }: DayHoursProps) {
  const { t } = useTranslation();
  const slots = getDaySlots(day, ctx);
  const rows = toRows(slots);
  const hasFree = slots.some((s) => s.state === "free");

  return (
    <div>
      {!hasFree && (
        <p className={`${typography.caption} mb-3`}>{t("studio.calendar.noFreeHours")}</p>
      )}
      <ul className="flex flex-col gap-1.5">
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

          if (row.kind === "free") {
            const { slot } = row;
            return (
              <li key={slot.hour}>
                <button
                  type="button"
                  onClick={() => onPick(slot)}
                  className={`${rowBase} ${slotStyles.free}`}
                >
                  <span className={timeCol}>{formatStudio(slot.startsAt, "HH:mm", "ru")}</span>
                  <span className="text-sm">{t("studio.calendar.free")}</span>
                </button>
              </li>
            );
          }

          const { first, last, state } = row;
          const label = unavailableLabel[state];
          return (
            <li key={first.hour} className={`${rowBase} ${slotStyles.unavailable}`}>
              <span className={timeCol}>
                {first === last
                  ? formatStudio(first.startsAt, "HH:mm", "ru")
                  : formatTimeRange(first.startsAt, hourStart(day, last.hour + 1))}
              </span>
              {label && (
                <span className="text-sm">{t(label, { count: ctx.settings.minBookingHours })}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
