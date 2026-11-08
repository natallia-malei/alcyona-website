import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { AdminBooking, BookingClient, Locale, StudioSettings } from "../../../types";
import { bookingErrorKey, fetchStudioSettings } from "../../../supabase/bookings";
import {
  approveBooking,
  fetchPendingRequests,
  fetchUnmarkedAttendance,
  rejectBooking,
} from "../../../supabase/manage";
import { personName } from "../../../utils/studioManage";
import { dayKeyOf, formatDay, formatStudio, formatTimeRange } from "../../../utils/studioTime";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { SectionTitle } from "../../ui/SectionTitle";
import { typography } from "../../../styles/typography";
import { statusTextClass } from "../slotStyles";
import { AttendanceButtons } from "./AttendanceButtons";
import { ClientBadge } from "./ClientBadge";
import { manageTabPath } from "./manageLinks";

export interface RequestsTabProps {
  onPendingCount: (count: number) => void; // number on the tab button
}

interface RequestsData {
  requests: AdminBooking[];
  attendance: AdminBooking[];
  settings: StudioSettings;
}

const linkClass = "text-white hover:text-accent underline-offset-4 hover:underline";

export function RequestsTab({ onPendingCount }: RequestsTabProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<RequestsData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const requestId = useRef(0);

  const reload = useCallback(() => {
    const id = ++requestId.current;
    return Promise.all([
      fetchPendingRequests(),
      fetchUnmarkedAttendance(),
      fetchStudioSettings(),
    ]).then(
      ([requests, attendance, settings]) => {
        // A newer reload started meanwhile — only its result counts
        if (id !== requestId.current) return;
        setData({ requests, attendance, settings });
        setError(null);
        onPendingCount(requests.length);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        console.error("Failed to load requests", e);
        setError(e);
      },
    );
  }, [onPendingCount]);

  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  const handleChanged = useCallback(() => void reload(), [reload]);

  if (!data) {
    return error ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className={typography.caption}>{t("studio.manage.loadFailed")}</p>
        <Button variant="outline" size="sm" onClick={handleChanged}>
          {t("studio.manage.retry")}
        </Button>
      </div>
    ) : (
      <RequestsSkeleton />
    );
  }

  const { requests, attendance, settings } = data;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <SectionTitle size="sm" className="mb-6">
          {t("studio.manage.requests.title")}
        </SectionTitle>
        {requests.length === 0 ? (
          <p className={typography.caption}>{t("studio.manage.requests.empty")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {requests.map((b) => (
              <RequestCard
                key={b.id}
                booking={b}
                noShowLimit={settings.noShowLimit}
                onChanged={handleChanged}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle size="sm" className="mb-2">
          {t("studio.manage.requests.attendanceTitle")}
        </SectionTitle>
        <p className={`${typography.caption} mb-6`}>
          {t("studio.manage.requests.attendanceHint", { limit: settings.noShowLimit })}
        </p>
        {attendance.length === 0 ? (
          <p className={typography.caption}>{t("studio.manage.requests.attendanceEmpty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
            {attendance.map((b) => (
              <AttendanceRow key={b.id} booking={b} onChanged={handleChanged} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Client name linking to their card in the Clients tab, plus the trust badge
function ClientLine({ client }: { client: BookingClient | null }) {
  const { t } = useTranslation();
  if (!client) return <span className="text-fg-muted">{personName(null, t)}</span>;

  return (
    <span className="inline-flex flex-wrap items-center gap-2 min-w-0">
      <Link to={manageTabPath("clients", client.id)} className={`${linkClass} break-words`}>
        {personName(client, t)}
      </Link>
      <ClientBadge client={client} />
    </span>
  );
}

interface RequestCardProps {
  booking: AdminBooking;
  noShowLimit: number;
  onChanged: () => void;
}

function RequestCard({ booking: b, noShowLimit, onChanged }: RequestCardProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const range = formatTimeRange(b.startsAt, b.endsAt);
  const client = b.client;
  const telegram = client?.telegramUsername.replace(/^@/, "") ?? "";

  // "HH:mm" today, "d MMM, HH:mm" on another day
  const expires = b.expiresAt
    ? formatStudio(
        b.expiresAt,
        dayKeyOf(b.expiresAt) === dayKeyOf(new Date()) ? "HH:mm" : "d MMM, HH:mm",
        locale,
      )
    : null;

  const run = async (action: () => Promise<void>, successKey: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(t(successKey));
    } catch (e) {
      // request_expired / not_pending etc. — the reload shows the actual state
      toast.error(t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
      onChanged();
    }
  };

  const handleApprove = () =>
    void run(() => approveBooking(b.id), "studio.manage.requests.approved");

  const handleReject = async () => {
    const ok = await confirm({
      message: t("studio.manage.requests.rejectConfirm", {
        name: personName(client, t),
        when: `${formatStudio(b.startsAt, "d MMMM", locale)}, ${range}`,
      }),
      variant: "danger",
    });
    if (ok) await run(() => rejectBooking(b.id), "studio.manage.requests.rejected");
  };

  return (
    <li className="flex flex-col gap-3 p-4 bg-bg-elevated border border-white/10 border-l-2 border-l-amber-400 rounded-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-white first-letter:uppercase">
          {formatDay(dayKeyOf(b.startsAt), "EEEE, d MMMM", locale)}
        </span>
        <span className="text-white tabular-nums">{range}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <ClientLine client={client} />
        {client && client.noShowCount > 0 && (
          <span className="text-red-400">
            {t("studio.manage.noShows", { count: client.noShowCount, limit: noShowLimit })}
          </span>
        )}
        {(client?.phone || telegram) && (
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {client?.phone && (
              <a href={`tel:${client.phone}`} className={`${linkClass} tabular-nums`}>
                {client.phone}
              </a>
            )}
            {telegram && (
              <a
                href={`https://t.me/${telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                @{telegram}
              </a>
            )}
          </span>
        )}
      </div>

      {b.purpose && <p className="text-sm text-fg-muted break-words">{b.purpose}</p>}

      {expires && (
        <p className={`text-xs ${statusTextClass.pending}`}>
          {t("studio.manage.requests.expiresAt", { time: expires })}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button size="sm" disabled={busy} onClick={handleApprove}>
          {t("studio.manage.requests.approve")}
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleReject()}>
          {t("studio.manage.requests.reject")}
        </Button>
      </div>
    </li>
  );
}

function AttendanceRow({
  booking: b,
  onChanged,
}: {
  booking: AdminBooking;
  onChanged: () => void;
}) {
  const { i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1 text-sm">
        <span className="text-white tabular-nums">
          {formatDay(dayKeyOf(b.startsAt), "EEEEEE, d MMM", locale)}
        </span>
        <span className="text-fg-muted tabular-nums">{formatTimeRange(b.startsAt, b.endsAt)}</span>
        <ClientLine client={b.client} />
      </div>
      <AttendanceButtons bookingId={b.id} attended={null} onChanged={onChanged} />
    </li>
  );
}

const block = "rounded-sm bg-white/5 animate-pulse";

// Shape of the tab while it loads
function RequestsSkeleton() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-12">
      <span className="sr-only">{t("app.loading")}</span>
      <div className="space-y-6">
        <div className={`${block} h-8 w-64`} />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className={`${block} h-48`} />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className={`${block} h-8 w-56`} />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${block} h-10`} />
        ))}
      </div>
    </div>
  );
}
