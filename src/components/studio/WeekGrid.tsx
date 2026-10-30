import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { CalendarBooking, Locale } from "../../types";
import {
  bookingTitle,
  dayHours,
  daysFrom,
  formatDay,
  formatStudio,
  formatTimeRange,
  getDaySlots,
  hourOf,
  reasonText,
  unavailableReason,
  type DayKey,
  type HourSlot,
  type SlotContext,
} from "../../utils/studioTime";
import { slotStyles, statusTextClass } from "./slotStyles";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface WeekGridProps {
  weekStart: DayKey; // Monday
  today: DayKey;
  ctx: SlotContext;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPick: (slot: HourSlot) => void; // only for state "free"
  onExplain: (slot: HourSlot) => void; // tap on an unavailable hour → why
  highlightId?: string | null; // just-created booking, briefly outlined
}

// One item in a day column: a single hour, or a booking spanning several rows
type Cell =
  | { kind: "slot"; row: number; slot: HourSlot }
  | { kind: "booking"; row: number; span: number; booking: CalendarBooking };

// Consecutive hours of the same booking merge into one block. Working from the
// visible slots clips bookings to open hours and to this day.
function dayCells(day: DayKey, ctx: SlotContext): Cell[] {
  const cells: Cell[] = [];
  getDaySlots(day, ctx).forEach((slot, row) => {
    const prev = cells[cells.length - 1];
    if (!slot.booking) {
      cells.push({ kind: "slot", row, slot });
    } else if (prev?.kind === "booking" && prev.booking.id === slot.booking.id) {
      prev.span += 1;
    } else {
      cells.push({ kind: "booking", row, span: 1, booking: slot.booking });
    }
  });
  return cells;
}

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const COLUMNS = "3.5rem repeat(7, minmax(0, 1fr))";
const ROW_HEIGHT = "2.25rem";

// Hour rows start at grid row 1 (the day header is a separate sticky grid)
const place = (column: number, row: number, span = 1): CSSProperties => ({
  gridColumn: column,
  gridRow: `${row + 1} / span ${span}`,
});

// Re-renders every minute so the "now" line moves
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function WeekGrid({
  weekStart,
  today,
  ctx,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onPick,
  onExplain,
  highlightId,
}: WeekGridProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const days = daysFrom(weekStart, 7);
  const hours = dayHours(ctx.settings);
  const now = useNow();
  // Hovered free hour: highlights the shortest booking that would start there
  const [hovered, setHovered] = useState<{ day: DayKey; hour: number } | null>(null);
  const previewHours = ctx.viewer.isAdmin ? 1 : ctx.settings.minBookingHours;
  const inPreview = (day: DayKey, hour: number) =>
    hovered !== null &&
    hovered.day === day &&
    hour >= hovered.hour &&
    hour < hovered.hour + previewHours;

  const rangeLabel = `${formatDay(days[0], "d MMM", locale)} – ${formatDay(days[6], "d MMM", locale)}`;

  // "Now" line: today's column, inside the current hour's row
  const todayColumn = days.indexOf(today);
  const nowRow = hourOf(now) - ctx.settings.openHour;
  const showNow = todayColumn !== -1 && nowRow >= 0 && nowRow < hours.length;
  const nowMinutes = Number(formatStudio(now, "m", locale));

  const renderCell = (day: DayKey, cell: Cell, column: number) => {
    if (cell.kind === "booking") {
      const b = cell.booking;
      const mine = b.isMine;
      const style = mine
        ? b.status === "pending"
          ? slotStyles.minePending
          : slotStyles.mineConfirmed
        : b.status === "pending"
          ? slotStyles.busyPending
          : slotStyles.busy;
      const title = mine && !b.title ? t("studio.calendar.mine") : bookingTitle(b, t);
      const time = formatTimeRange(b.startsAt, b.endsAt);
      // status / purpose come only for the author and admin (get_calendar decides)
      const status = b.status ? t(`studio.status.${b.status}`) : null;
      const tooltip = [title, time, status, b.purpose].filter(Boolean).join("\n");

      return (
        <div
          key={`${day}-b-${b.id}`}
          data-booking={b.id}
          style={place(column, cell.row, cell.span)}
          title={tooltip}
          className={`${style} rounded-sm px-2 py-1 overflow-hidden min-w-0 flex flex-col text-xs leading-4 transition-shadow ${
            b.id === highlightId ? slotStyles.highlight : ""
          }`}
        >
          <span className="font-semibold truncate">{title}</span>
          <span className="truncate opacity-80">{time}</span>
          {status && b.status && (
            <span className={`truncate ${statusTextClass[b.status]}`}>{status}</span>
          )}
          {b.purpose && <span className="truncate opacity-70">{b.purpose}</span>}
        </div>
      );
    }

    const { slot } = cell;
    const timeRange = `${hourLabel(slot.hour)}–${hourLabel(slot.hour + 1)}`;

    if (slot.state === "free") {
      const dateLabel = formatDay(slot.day, "EEEE, d MMMM", locale);
      return (
        <button
          key={`${day}-${slot.hour}`}
          type="button"
          style={place(column, cell.row)}
          onClick={() => onPick(slot)}
          onMouseEnter={() => setHovered({ day, hour: slot.hour })}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered({ day, hour: slot.hour })}
          onBlur={() => setHovered(null)}
          aria-label={`${t("studio.calendar.free")}: ${dateLabel}, ${timeRange}`}
          className={`${inPreview(day, slot.hour) ? slotStyles.preview : slotStyles.free} rounded-sm text-xs focus-visible:outline-2 focus-visible:outline-accent`}
        >
          {hovered?.day === day && hovered.hour === slot.hour && (
            <span aria-hidden>+ {hourLabel(slot.hour)}</span>
          )}
        </button>
      );
    }

    // Unavailable: a click explains why. Out of the tab order — a week has
    // dozens of these; keyboard users get the reason from the label.
    const reason = unavailableReason(slot, ctx);
    const label = reason ? reasonText(reason, ctx, t, "label") : undefined;
    return (
      <button
        key={`${day}-${slot.hour}`}
        type="button"
        tabIndex={-1}
        style={place(column, cell.row)}
        onClick={() => onExplain(slot)}
        title={label}
        aria-label={label ? `${timeRange}: ${label}` : timeRange}
        className={`${inPreview(day, slot.hour) ? slotStyles.preview : slotStyles.unavailable} rounded-sm cursor-help`}
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ArrowButton
            direction="prev"
            label={t("studio.calendar.prevWeek")}
            disabled={!canGoPrev}
            onClick={onPrev}
          />
          <p className={`${typography.eyebrow} text-white min-w-40 text-center`}>{rangeLabel}</p>
          <ArrowButton
            direction="next"
            label={t("studio.calendar.nextWeek")}
            disabled={!canGoNext}
            onClick={onNext}
          />
        </div>
        <p className={typography.caption}>{t("studio.calendar.timezone")}</p>
      </div>

      {/* Day header stays under the site header while the hours scroll */}
      <div
        className="sticky top-16 z-20 grid gap-1 py-2 bg-bg border-b border-white/10"
        style={{ gridTemplateColumns: COLUMNS }}
      >
        {days.map((day, i) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              style={{ gridColumn: i + 2 }}
              aria-current={isToday ? "date" : undefined}
              className={`text-center ${typography.eyebrowXs} ${
                isToday ? "text-accent" : "text-fg-muted"
              }`}
            >
              <span className="block">{formatDay(day, "EEEEEE", locale)}</span>
              <span
                className={`inline-block mt-1 px-2 rounded-sm text-sm ${
                  isToday ? "bg-accent text-on-accent" : "text-white"
                }`}
              >
                {formatDay(day, "d", locale)}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="grid gap-1 mt-1"
        style={{
          gridTemplateColumns: COLUMNS,
          gridTemplateRows: `repeat(${hours.length}, ${ROW_HEIGHT})`,
        }}
      >
        {hours.map((hour, row) => (
          <div key={hour} style={place(1, row)} className="pr-2 text-right text-xs text-fg-muted">
            {hourLabel(hour)}
          </div>
        ))}

        {days.flatMap((day, i) => dayCells(day, ctx).map((cell) => renderCell(day, cell, i + 2)))}

        {showNow && (
          <div
            aria-hidden
            style={place(todayColumn + 2, nowRow)}
            className="relative z-10 pointer-events-none"
          >
            <div
              className="absolute inset-x-0 h-0.5 bg-red-500"
              style={{ top: `${(nowMinutes / 60) * 100}%` }}
            >
              <span className="absolute -left-1 -top-[3px] size-2 rounded-full bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ArrowButtonProps {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function ArrowButton({ direction, label, disabled, onClick }: ArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`p-2 rounded-sm border border-white/10 ${interactive.mutedHover} hover:border-accent disabled:opacity-30 disabled:pointer-events-none`}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points={direction === "prev" ? "15 6 9 12 15 18" : "9 6 15 12 9 18"} />
      </svg>
    </button>
  );
}
