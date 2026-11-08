import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { AdminBooking, BookingStatus, Locale } from "../../../types";
import { formatStudio, formatTimeRange } from "../../../utils/studioTime";
import { bookingErrorKey } from "../../../supabase/bookings";
import { approveBooking, cancelBooking, rejectBooking } from "../../../supabase/manage";
import { adminBookingPhone, adminBookingTitle } from "../../../utils/studioManage";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";
import { SheetFrame } from "../BookingSheet";
import { statusTextClass } from "../slotStyles";
import { AttendanceButtons } from "./AttendanceButtons";
import { ClientBadge } from "./ClientBadge";
import { manageTabPath } from "./manageLinks";

interface AdminBookingDialogProps {
  booking: AdminBooking | null; // open when not null
  now: Date;
  onClose: () => void;
  onChanged: () => void; // reload the week + the requests count
}

const linkClass = "text-white hover:text-accent underline-offset-4 hover:underline";

// Details of one booking with the actions that fit its state
export function AdminBookingDialog({ booking, now, onClose, onChanged }: AdminBookingDialogProps) {
  if (!booking) return null;

  return (
    <SheetFrame onClose={onClose}>
      {(titleId) => (
        <BookingDetails
          key={booking.id}
          titleId={titleId}
          booking={booking}
          now={now}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </SheetFrame>
  );
}

interface BookingDetailsProps {
  titleId: string;
  booking: AdminBooking;
  now: Date;
  onClose: () => void;
  onChanged: () => void;
}

function BookingDetails({ titleId, booking: b, now, onClose, onChanged }: BookingDetailsProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  // Requests expire lazily in the DB: an overdue 'pending' row is already expired
  const status: BookingStatus =
    b.status === "pending" && b.expiresAt && b.expiresAt <= now ? "expired" : b.status;
  const started = b.startsAt <= now;
  const title = adminBookingTitle(b, t);
  const range = formatTimeRange(b.startsAt, b.endsAt);
  const when = `${formatStudio(b.startsAt, "d MMMM", locale)}, ${range}`;
  const phone = adminBookingPhone(b);
  const telegram = b.client?.telegramUsername.replace(/^@/, "") ?? "";

  // Runs an action; `close` — the booking leaves the calendar or is done with
  const run = async (action: () => Promise<void>, success: string, close: boolean) => {
    setBusy(true);
    try {
      await action();
      toast.success(t(success));
      onChanged();
      if (close) onClose();
    } catch (e) {
      toast.error(t(bookingErrorKey(e)));
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = () =>
    run(() => approveBooking(b.id), "studio.manage.requests.approved", true);

  const handleReject = async () => {
    const ok = await confirm({
      message: t("studio.manage.requests.rejectConfirm", { name: title, when }),
      variant: "danger",
    });
    if (ok) await run(() => rejectBooking(b.id), "studio.manage.requests.rejected", true);
  };

  const handleCancel = async () => {
    const ok = await confirm({
      message: t("studio.manage.booking.cancelConfirm", { name: title, when }),
      variant: "danger",
    });
    if (ok) await run(() => cancelBooking(b.id), "studio.manage.booking.cancelled", true);
  };

  const actions = ((): ReactNode => {
    if (status === "pending") {
      return (
        <div className="flex flex-wrap gap-3">
          <Button size="sm" disabled={busy} onClick={() => void handleApprove()}>
            {t("studio.manage.requests.approve")}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleReject()}>
            {t("studio.manage.requests.reject")}
          </Button>
        </div>
      );
    }
    if (status !== "confirmed") return null;
    if (!started) {
      return (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleCancel()}>
          {t("studio.manage.booking.cancel")}
        </Button>
      );
    }
    // Not for the admin's own bookings — attendance only matters for clients' trust
    if ((b.kind === "client" && b.client?.role !== "admin") || b.kind === "guest") {
      return (
        <div className="space-y-2">
          <p className={typography.caption}>{t("studio.manage.booking.attendance")}</p>
          <AttendanceButtons bookingId={b.id} attended={b.attended} onChanged={onChanged} />
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      <div className="pr-8">
        <h2 id={titleId} className="text-xl font-semibold text-white break-words">
          {title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`${typography.eyebrowXs} text-[10px] text-fg-muted`}>
            {t(`studio.manage.kind.${b.kind}`)}
          </span>
          {b.kind === "client" && b.client && <ClientBadge client={b.client} />}
        </div>
        <p className={`mt-2 ${typography.caption} first-letter:uppercase`}>
          {formatStudio(b.startsAt, "EEEE, d MMMM", locale)} ·{" "}
          <span className="tabular-nums">{range}</span>
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <Row label={t("studio.manage.booking.status")}>
          <span className={statusTextClass[status]}>{t(`studio.status.${status}`)}</span>
        </Row>
        {phone && (
          <Row label={t("studio.manage.booking.phone")}>
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={`${linkClass} tabular-nums`}>
              {phone}
            </a>
          </Row>
        )}
        {telegram && (
          <Row label={t("studio.manage.booking.telegram")}>
            <a
              href={`https://t.me/${telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              @{telegram}
            </a>
          </Row>
        )}
        {b.purpose && (
          <Row label={t("studio.manage.booking.purpose")}>
            <span className="whitespace-pre-line break-words">{b.purpose}</span>
          </Row>
        )}
      </dl>

      <p className="text-xs text-fg-muted">
        {t("studio.manage.booking.createdAt", {
          date: formatStudio(b.createdAt, "d MMMM yyyy, HH:mm", locale),
        })}
      </p>

      {actions}

      {b.kind === "client" && b.client && (
        <Link
          to={manageTabPath("clients", b.client.id)}
          className={`inline-block text-sm ${linkClass}`}
        >
          {t("studio.manage.booking.openClient")} →
        </Link>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-white">{children}</dd>
    </>
  );
}
