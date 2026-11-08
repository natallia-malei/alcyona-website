import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AdminBooking, Locale } from "../../../types";
import { fetchClientBookings } from "../../../supabase/manage";
import { formatStudio, formatTimeRange } from "../../../utils/studioTime";
import { statusTextClass } from "../slotStyles";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";

// Cached per client in ClientsTab, so re-opening shows the old rows while refetching
export interface ClientHistory {
  bookings: AdminBooking[];
  loadedAt: Date; // "now" for the lazy request expiry
}

interface ClientsHistoryProps {
  clientId: string;
  history: ClientHistory | null;
  version: number; // refetch when the clients list reloads
  onLoaded: (clientId: string, history: ClientHistory) => void;
}

// Every booking of the client, newest first. Fetches on open (mount).
export function ClientsHistory({ clientId, history, version, onLoaded }: ClientsHistoryProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;
    fetchClientBookings(clientId).then(
      (bookings) => {
        if (stale) return;
        setFailed(false);
        onLoaded(clientId, { bookings, loadedAt: new Date() });
      },
      (e: unknown) => {
        if (stale) return;
        console.error("Failed to load client bookings", e);
        setFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [clientId, version, attempt, onLoaded]);

  if (!history) {
    return failed ? (
      <div className="flex flex-wrap items-center gap-3">
        <p role="alert" className="text-sm text-red-400">
          {t("studio.manage.loadFailed")}
        </p>
        <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
          {t("studio.manage.retry")}
        </Button>
      </div>
    ) : (
      <div aria-busy="true" className="flex flex-col gap-2">
        <span className="sr-only">{t("app.loading")}</span>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-5 rounded-sm bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.bookings.length === 0) {
    return <p className={typography.caption}>{t("studio.manage.clients.historyEmpty")}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {history.bookings.map((b) => {
        // Requests expire lazily in the DB: an overdue 'pending' row is already expired
        const status =
          b.status === "pending" && b.expiresAt && b.expiresAt <= history.loadedAt
            ? "expired"
            : b.status;
        return (
          <li
            key={b.id}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-sm first:pt-0 last:pb-0"
          >
            <span className="text-white tabular-nums">
              {formatStudio(b.startsAt, "d MMM yyyy", locale)}
            </span>
            <span className="text-white tabular-nums">{formatTimeRange(b.startsAt, b.endsAt)}</span>
            <span className={statusTextClass[status]}>{t(`studio.status.${status}`)}</span>
            {b.attended !== null && (
              <span className={b.attended ? "text-accent" : "text-red-400"}>
                {t(
                  b.attended ? "studio.manage.attendance.came" : "studio.manage.attendance.noShow",
                )}
              </span>
            )}
            {b.purpose && (
              <span
                className="basis-full md:basis-0 md:flex-1 min-w-0 truncate text-fg-muted"
                title={b.purpose}
              >
                {b.purpose}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
