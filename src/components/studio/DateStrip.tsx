import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "../../types";
import { formatDay, type DayAvailability, type DayKey } from "../../utils/studioTime";
import { typography } from "../../styles/typography";

interface DateStripProps {
  days: DayKey[];
  selected: DayKey;
  today: DayKey;
  availability: Record<DayKey, DayAvailability>;
  onSelect: (day: DayKey) => void;
}

// Dot under the date: bright = plenty of free time, dim = a little, none = fully booked
const dotClass: Record<DayAvailability, { normal: string; selected: string }> = {
  many: { normal: "bg-accent", selected: "bg-on-accent" },
  few: { normal: "bg-accent/40", selected: "bg-on-accent/50" },
  none: { normal: "bg-transparent", selected: "bg-transparent" },
};

const availabilityLabel: Partial<Record<DayAvailability, string>> = {
  few: "studio.calendar.dayFew",
  none: "studio.calendar.dayNone",
};

// Phone: horizontally scrollable row of day chips above the day's hours
export function DateStrip({ days, selected, today, availability, onSelect }: DateStripProps) {
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
        const free = availability[day] ?? "many";
        // Month label on the first chip and wherever a new month starts
        const showMonth = i === 0 || day.slice(0, 7) !== days[i - 1].slice(0, 7);
        const label = [
          formatDay(day, "EEEE, d MMMM", locale),
          isToday ? t("studio.calendar.today") : null,
          availabilityLabel[free] ? t(availabilityLabel[free]) : null,
        ]
          .filter(Boolean)
          .join(" — ");

        return (
          <li key={day} className="shrink-0 snap-start">
            <button
              type="button"
              data-day={day}
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={label}
              className={`flex flex-col items-center justify-center min-w-14 min-h-16 px-2 py-1.5 rounded-sm border transition-colors ${
                isSelected
                  ? "bg-accent border-accent text-on-accent"
                  : `${isToday ? "border-accent/60" : "border-white/10"} ${
                      free === "none" ? "text-fg-muted/40" : "text-fg-muted"
                    } hover:border-accent hover:text-white`
              }`}
            >
              <span className={`${typography.eyebrowXs} text-[10px] leading-tight`}>
                {showMonth ? formatDay(day, "LLL", locale) : " "}
              </span>
              <span className="text-xs leading-tight">{formatDay(day, "EEEEEE", locale)}</span>
              <span className="text-lg font-semibold leading-tight">
                {formatDay(day, "d", locale)}
              </span>
              <span
                aria-hidden
                className={`mt-1 h-1 w-4 rounded-full ${
                  isSelected ? dotClass[free].selected : dotClass[free].normal
                }`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
