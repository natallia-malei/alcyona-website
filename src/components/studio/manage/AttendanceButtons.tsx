import { useState } from "react";
import { useTranslation } from "react-i18next";
import { bookingErrorKey } from "../../../supabase/bookings";
import { markAttendance } from "../../../supabase/manage";
import { useToast } from "../../../hooks/useToast";

interface AttendanceButtonsProps {
  bookingId: string;
  attended: boolean | null; // current mark
  onChanged: () => void; // reload after a change (trust / no-shows change in the DB)
}

// "Came" / "No-show" toggle; pressing the active one clears the mark
export function AttendanceButtons({ bookingId, attended, onChanged }: AttendanceButtonsProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const mark = async (value: boolean) => {
    const next = attended === value ? null : value;
    setBusy(true);
    try {
      await markAttendance(bookingId, next);
      toast.success(
        t(next === null ? "studio.manage.attendance.cleared" : "studio.manage.attendance.marked"),
      );
      onChanged();
    } catch (e) {
      toast.error(t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const button = (value: boolean, label: string, activeClass: string) => {
    const active = attended === value;
    return (
      <button
        type="button"
        disabled={busy}
        aria-pressed={active}
        title={active ? t("studio.manage.attendance.clear") : undefined}
        onClick={() => void mark(value)}
        className={`px-3 py-1.5 text-sm rounded-sm border transition-colors disabled:opacity-50 ${
          active
            ? activeClass
            : "border-white/20 text-fg-muted hover:border-accent hover:text-white"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {button(true, t("studio.manage.attendance.came"), "border-accent bg-accent/20 text-white")}
      {button(
        false,
        t("studio.manage.attendance.noShow"),
        "border-red-500/70 bg-red-950/40 text-red-300",
      )}
    </div>
  );
}
