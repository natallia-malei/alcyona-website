import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "../../../types";
import {
  addDays,
  dayAvailability,
  dayKeyOf,
  daysFrom,
  formatDay,
  reasonText,
  unavailableReason,
  weekStartOf,
  type DayKey,
  type HourSlot,
  type SlotContext,
} from "../../../utils/studioTime";
import { toCalendarBooking } from "../../../utils/studioManage";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";
import { interactive } from "../../../styles/interactive";
import { CalendarSkeleton } from "../CalendarSkeleton";
import { DateStrip } from "../DateStrip";
import { DayHours } from "../DayHours";
import { WeekGrid } from "../WeekGrid";
import { AdminBookingDialog } from "./AdminBookingDialog";
import { AdminBookingSheet } from "./AdminBookingSheet";
import { useAdminCalendar } from "./useAdminCalendar";

export interface CalendarTabProps {
  onRequestsChanged: () => void; // approved / rejected / cancelled a request → page reloads the tab count
}

const ADMIN_VIEWER = { isAdmin: true, unlimited: true, trusted: true } as const;

// Every booking week by week: free hour → new booking, booking → details and actions.
// No horizon: past weeks for attendance, any future week for closing time.
export function CalendarTab({ onRequestsChanged }: CalendarTabProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const toast = useToast();

  // One state for both views: the week is the one this day belongs to
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => dayKeyOf(new Date()));
  const weekStart = weekStartOf(selectedDay);
  const { data, error, reload } = useAdminCalendar(weekStart);

  const [picked, setPicked] = useState<HourSlot | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const ctx = useMemo<SlotContext | null>(
    () =>
      data
        ? {
            bookings: data.bookings.map((b) => toCalendarBooking(b, t)),
            settings: data.settings,
            now: data.now,
            viewer: ADMIN_VIEWER,
          }
        : null,
    [data, t],
  );

  // Re-read by id, so the dialog shows fresh data (e.g. attendance) after a reload
  const opened = (openId && data?.byId.get(openId)) || null;

  const handleExplain = (slot: HourSlot) => {
    const reason = ctx && unavailableReason(slot, ctx);
    if (reason) toast.info(reasonText(reason, ctx, t, "hint"));
  };

  const handleChanged = () => {
    void reload();
    onRequestsChanged();
  };

  const shiftWeek = (weeks: number) => setSelectedDay((d) => addDays(d, weeks * 7));

  if (!data || !ctx) {
    if (error) {
      return (
        <div className="space-y-4">
          <p className={typography.caption}>{t("studio.manage.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            {t("studio.manage.retry")}
          </Button>
        </div>
      );
    }
    return <CalendarSkeleton />;
  }

  const today = dayKeyOf(data.now); // moves on with every reload, even past midnight
  const days = daysFrom(weekStart, 7);
  const availability = Object.fromEntries(days.map((d) => [d, dayAvailability(d, ctx)]));
  const rangeLabel = `${formatDay(days[0], "d MMM", locale)} – ${formatDay(days[6], "d MMM", locale)}`;
  // Data of the previous week until the new one arrives — dim and lock the views
  const stale = data.weekStart !== weekStart;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="md:hidden flex items-center gap-2">
          <AdminCalendarArrow
            direction="prev"
            label={t("studio.calendar.prevWeek")}
            onClick={() => shiftWeek(-1)}
          />
          <p className={`${typography.eyebrowXs} text-white min-w-28 text-center`}>{rangeLabel}</p>
          <AdminCalendarArrow
            direction="next"
            label={t("studio.calendar.nextWeek")}
            onClick={() => shiftWeek(1)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={selectedDay === today}
          onClick={() => setSelectedDay(today)}
        >
          {t("studio.calendar.today")}
        </Button>
      </div>

      {stale && error ? (
        <div className="space-y-4">
          <p className={typography.caption}>{t("studio.manage.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            {t("studio.manage.retry")}
          </Button>
        </div>
      ) : (
        <div
          aria-busy={stale}
          className={stale ? "opacity-50 pointer-events-none transition-opacity" : undefined}
        >
          <div className="md:hidden space-y-4">
            <p className={typography.caption}>{t("studio.calendar.timezone")}</p>
            <DateStrip
              days={days}
              selected={selectedDay}
              today={today}
              availability={availability}
              onSelect={setSelectedDay}
            />
            <DayHours
              day={selectedDay}
              ctx={ctx}
              onPick={setPicked}
              onExplain={handleExplain}
              onOpenBooking={setOpenId}
            />
          </div>
          <div className="hidden md:block">
            <WeekGrid
              weekStart={weekStart}
              today={today}
              ctx={ctx}
              canGoPrev
              canGoNext
              onPrev={() => shiftWeek(-1)}
              onNext={() => shiftWeek(1)}
              onPick={setPicked}
              onExplain={handleExplain}
              onOpenBooking={setOpenId}
            />
          </div>
        </div>
      )}

      <AdminBookingSheet
        slot={picked}
        ctx={ctx}
        onClose={() => setPicked(null)}
        onDone={() => void reload()}
      />
      <AdminBookingDialog
        booking={opened}
        now={data.now}
        onClose={() => setOpenId(null)}
        onChanged={handleChanged}
      />
    </div>
  );
}

interface AdminCalendarArrowProps {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
}

// Same look as the week grid's arrows
function AdminCalendarArrow({ direction, label, onClick }: AdminCalendarArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`p-2 rounded-sm border border-white/10 ${interactive.mutedHover} hover:border-accent`}
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
