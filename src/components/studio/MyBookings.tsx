import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Locale, MyBooking, StudioSettings } from "../../types";
import {
  cancelOption,
  effectiveStatus,
  formatStudio,
  formatTimeRange,
} from "../../utils/studioTime";
import { bookingErrorKey, cancelBooking } from "../../supabase/bookings";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { statusTextClass } from "./slotStyles";
import { SectionTitle } from "../ui/SectionTitle";
import { typography } from "../../styles/typography";

interface MyBookingsProps {
  bookings: MyBooking[];
  settings: StudioSettings;
  now: Date;
  isAdmin: boolean;
  onChanged: () => void; // page refreshes after cancel/withdraw (or a failed attempt)
  onEditProfile: () => void;
}

const statusClass: Record<MyBooking["status"], string> = {
  confirmed: "bg-accent/20 border border-accent/60 text-white",
  pending: `border border-dashed border-current ${statusTextClass.pending}`,
  cancelled: "border border-white/10 text-fg-muted",
  rejected: "border border-red-900/60 text-red-400",
  expired: "border border-white/10 text-fg-muted",
};

export function MyBookings({
  bookings,
  settings,
  now,
  isAdmin,
  onChanged,
  onEditProfile,
}: MyBookingsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <SectionTitle size="sm" className="mb-6">
        {t("studio.my.title")}
      </SectionTitle>

      {bookings.length === 0 ? (
        <p className={typography.caption}>{t("studio.my.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => (
            <BookingItem
              key={b.id}
              booking={b}
              settings={settings}
              now={now}
              isAdmin={isAdmin}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {!isAdmin && (
          <p className={typography.caption}>
            {t("studio.my.limit", { count: settings.maxActiveBookings })}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={onEditProfile} className="ml-auto">
          {t("studio.my.editProfile")}
        </Button>
      </div>
    </div>
  );
}

interface BookingItemProps {
  booking: MyBooking;
  settings: StudioSettings;
  now: Date;
  isAdmin: boolean;
  onChanged: () => void;
}

function BookingItem({ booking, settings, now, isAdmin, onChanged }: BookingItemProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const status = effectiveStatus(booking, now);
  const option = cancelOption(booking, settings, now, isAdmin);
  const range = formatTimeRange(booking.startsAt, booking.endsAt);

  const handleCancel = async (kind: "withdraw" | "cancel") => {
    const when = `${formatStudio(booking.startsAt, "d MMMM", locale)}, ${range}`;
    const ok = await confirm({
      message: t(kind === "withdraw" ? "studio.my.withdrawConfirm" : "studio.my.cancelConfirm", {
        when,
      }),
      variant: "danger",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await cancelBooking(booking.id);
      toast.success(t(kind === "withdraw" ? "studio.my.withdrawn" : "studio.my.cancelled"));
    } catch (err) {
      toast.error(t(bookingErrorKey(err)));
    } finally {
      setBusy(false);
      onChanged();
    }
  };

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 p-4 border border-white/10 rounded-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-white first-letter:uppercase">
            {formatStudio(booking.startsAt, "EEEE, d MMMM", locale)}
          </span>
          <span className="text-white tabular-nums">{range}</span>
          <span
            className={`px-2 py-0.5 rounded-sm ${typography.eyebrowXs} text-[10px] ${statusClass[status]}`}
          >
            {t(`studio.status.${status}`)}
          </span>
        </div>
        {booking.purpose && (
          <p className="mt-1 text-sm text-fg-muted break-words">{booking.purpose}</p>
        )}
        {status === "pending" && booking.expiresAt && (
          <p className="mt-1 text-xs text-fg-muted">
            {t("studio.my.pendingUntil", {
              time: formatStudio(booking.expiresAt, "d MMM, HH:mm", locale),
            })}
          </p>
        )}
      </div>

      {(option === "withdraw" || option === "cancel") && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void handleCancel(option)}
          className="self-start md:self-center shrink-0"
        >
          {t(option === "withdraw" ? "studio.my.withdraw" : "studio.my.cancel")}
        </Button>
      )}
      {option === "via_admin" && (
        <p className={`${typography.caption} md:max-w-56`}>
          {t("studio.my.viaAdmin", { count: settings.freeCancelHours })}
        </p>
      )}
    </li>
  );
}
