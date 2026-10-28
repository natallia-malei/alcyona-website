import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Locale, MyBooking } from "../../types";
import { effectiveStatus, formatStudio } from "../../utils/studioTime";
import { statusTextClass } from "./slotStyles";

interface MyBookingsSummaryProps {
  bookings: MyBooking[];
  now: Date;
}

// Above the calendar: "You have 2 bookings · next Thu 29 Oct, 10:00 →" — links to #my-bookings
export function MyBookingsSummary({ bookings, now }: MyBookingsSummaryProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";

  const active = bookings.filter((b) => {
    const status = effectiveStatus(b, now);
    return (status === "pending" || status === "confirmed") && b.endsAt > now;
  });
  if (active.length === 0) return null;

  const next = active[0]; // fetchMyBookings orders by start
  const nextStatus = effectiveStatus(next, now);

  return (
    <Link
      to={{ hash: "my-bookings" }}
      className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 border border-white/10 rounded-sm text-sm text-white hover:border-accent transition-colors"
    >
      <span>{t("studio.my.summary", { count: active.length })}</span>
      <span className="text-fg-muted">·</span>
      <span className="text-fg-muted">
        {t("studio.my.nearest", {
          when: formatStudio(next.startsAt, "EEEEEE d MMM, HH:mm", locale),
        })}
      </span>
      {nextStatus === "pending" && (
        <span className={statusTextClass.pending}>({t("studio.status.pending")})</span>
      )}
      <span aria-hidden className="ml-auto text-accent">
        →
      </span>
    </Link>
  );
}
