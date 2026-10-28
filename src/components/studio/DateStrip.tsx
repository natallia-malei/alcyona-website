import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "../../types";
import { formatDay, type DayKey } from "../../utils/studioTime";
import { typography } from "../../styles/typography";

interface DateStripProps {
  days: DayKey[];
  selected: DayKey;
  today: DayKey;
  onSelect: (day: DayKey) => void;
}

// Phone: horizontally scrollable row of day chips above the day's hours
export function DateStrip({ days, selected, today, onSelect }: DateStripProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const listRef = useRef<HTMLUListElement>(null);

  // Horizontal only: scrollIntoView would also scroll the page (and break #my-bookings)
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <ul
      ref={listRef}
      className="relative flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 snap-x [scrollbar-width:none]"
    >
      {days.map((day, i) => {
        const isSelected = day === selected;
        const isToday = day === today;
        // Month label on the first chip and wherever a new month starts
        const showMonth = i === 0 || day.slice(0, 7) !== days[i - 1].slice(0, 7);

        return (
          <li key={day} className="shrink-0 snap-start">
            <button
              type="button"
              data-day={day}
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(day, "EEEE, d MMMM", locale)}${isToday ? ` — ${t("studio.calendar.today")}` : ""}`}
              className={`flex flex-col items-center justify-center min-w-14 min-h-16 px-2 py-1.5 rounded-sm border transition-colors ${
                isSelected
                  ? "bg-accent border-accent text-white"
                  : "border-white/10 text-fg-muted hover:border-accent hover:text-white"
              }`}
            >
              <span className={`${typography.eyebrowXs} text-[10px] leading-tight`}>
                {showMonth ? formatDay(day, "LLL", locale) : " "}
              </span>
              <span className="text-xs leading-tight">{formatDay(day, "EEEEEE", locale)}</span>
              <span className="text-lg font-semibold leading-tight">
                {formatDay(day, "d", locale)}
              </span>
              <span
                aria-hidden
                className={`mt-0.5 size-1 rounded-full ${
                  isToday ? (isSelected ? "bg-white" : "bg-accent") : "bg-transparent"
                }`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
