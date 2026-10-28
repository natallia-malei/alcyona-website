import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "../../types";
import {
  availableDurations,
  formatDay,
  formatStudio,
  formatTimeRange,
  hourStart,
  type HourSlot,
  type SlotContext,
} from "../../utils/studioTime";
import { BookingError, bookingErrorKey, createBooking } from "../../supabase/bookings";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { CloseIcon } from "../icons/CloseIcon";
import { typography } from "../../styles/typography";

interface BookingSheetProps {
  slot: HourSlot | null; // open when not null (a "free" slot)
  ctx: SlotContext;
  onClose: () => void;
  onDone: () => void; // page refreshes the calendar
}

const PURPOSE_MAX = 200;

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function BookingSheet({ slot, ctx, onClose, onDone }: BookingSheetProps) {
  if (!slot) return null;

  return (
    <SheetFrame onClose={onClose}>
      {(titleId) => (
        // A new slot remounts the form, so its state starts fresh
        <BookingForm
          key={slot.startsAt.getTime()}
          titleId={titleId}
          slot={slot}
          ctx={ctx}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </SheetFrame>
  );
}

// Bottom sheet on phones, centered dialog from md. Same focus trap / scroll lock as Modal.
function SheetFrame({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (titleId: string) => ReactNode;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Focus the first control on open, return focus to the slot button on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-end md:items-center justify-center md:p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full md:max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain bg-bg-elevated border border-white/10 border-b-0 md:border-b rounded-t-xl md:rounded-sm px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-fg-muted hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        {children(titleId)}
      </div>
    </div>
  );
}

interface BookingFormProps {
  titleId: string;
  slot: HourSlot;
  ctx: SlotContext;
  onClose: () => void;
  onDone: () => void;
}

function BookingForm({ titleId, slot, ctx, onClose, onDone }: BookingFormProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const toast = useToast();
  const purposeId = useId();
  const hintId = useId();

  const durations = availableDurations(slot.day, slot.hour, ctx);
  const [hours, setHours] = useState(durations[0] ?? 0);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The calendar may refresh while the sheet is open and shrink the options
  const selected = durations.includes(hours) ? hours : (durations[0] ?? 0);
  const trimmed = purpose.trim();
  const isRequest = !ctx.viewer.isAdmin && !ctx.viewer.trusted;
  const canSubmit = selected > 0 && trimmed.length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking(slot.startsAt, selected, trimmed);
      toast.success(
        t(booking.status === "confirmed" ? "studio.sheet.confirmed" : "studio.sheet.requested"),
      );
      onDone();
      onClose();
    } catch (err) {
      if (err instanceof BookingError && err.code === "slot_taken") {
        toast.error(t(bookingErrorKey(err)));
        onDone();
        onClose();
        return;
      }
      setError(t(bookingErrorKey(err)));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="pr-8">
        <h2 id={titleId} className="text-xl font-semibold text-white">
          {t("studio.sheet.title")}
        </h2>
        <p className={`mt-1 ${typography.caption} first-letter:uppercase`}>
          {formatDay(slot.day, "EEEE, d MMMM", locale)} ·{" "}
          {formatStudio(slot.startsAt, "HH:mm", locale)}
        </p>
      </div>

      <fieldset>
        <legend className={`mb-2 ${typography.caption}`}>{t("studio.sheet.duration")}</legend>
        <div className="flex flex-wrap gap-2">
          {durations.map((h) => {
            const active = h === selected;
            return (
              <button
                key={h}
                type="button"
                aria-pressed={active}
                onClick={() => setHours(h)}
                className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                  active
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/20 text-fg-muted hover:border-accent hover:text-white"
                }`}
              >
                {t("studio.sheet.hours", { count: h })}
              </button>
            );
          })}
        </div>
        {selected > 0 && (
          <p className="mt-2 text-sm text-white tabular-nums">
            {formatTimeRange(slot.startsAt, hourStart(slot.day, slot.hour + selected))}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor={purposeId} className={`block mb-2 ${typography.caption}`}>
          {t("studio.sheet.purpose")}
        </label>
        <textarea
          id={purposeId}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value.slice(0, PURPOSE_MAX))}
          maxLength={PURPOSE_MAX}
          placeholder={t("studio.sheet.purposePlaceholder")}
          rows={3}
          required
          aria-describedby={hintId}
          className="w-full px-3 py-2 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors font-sans resize-y"
        />
        <div id={hintId} className="mt-1 flex justify-between gap-4 text-xs text-fg-muted">
          {/* "Only you and the admin see this" makes no sense to the admin */}
          {!ctx.viewer.isAdmin && <span>{t("studio.sheet.purposeHint")}</span>}
          <span className="ml-auto tabular-nums shrink-0">
            {purpose.length}/{PURPOSE_MAX}
          </span>
        </div>
      </div>

      {isRequest && (
        <p className={typography.caption}>
          {t("studio.sheet.requestNote", { count: ctx.settings.requestTtlHours })}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full md:w-auto">
        {submitting
          ? t("studio.sheet.submitting")
          : t(isRequest ? "studio.sheet.submitRequest" : "studio.sheet.submit")}
      </Button>
    </form>
  );
}
