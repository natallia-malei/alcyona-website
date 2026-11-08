import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { AdminBookingTarget, Locale, StudioClient } from "../../../types";
import {
  availableDurations,
  formatDay,
  formatStudio,
  formatTimeRange,
  hourStart,
  type HourSlot,
  type SlotContext,
} from "../../../utils/studioTime";
import { BookingError, bookingErrorKey } from "../../../supabase/bookings";
import { adminCreateBooking, fetchClients } from "../../../supabase/manage";
import { matchesClient, personName } from "../../../utils/studioManage";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { typography } from "../../../styles/typography";
import { SheetFrame } from "../BookingSheet";
import { ClientBadge } from "./ClientBadge";

interface AdminBookingSheetProps {
  slot: HourSlot | null; // open when not null (a "free" slot)
  ctx: SlotContext;
  onClose: () => void;
  onDone: () => void; // reload the calendar
}

type TargetKind = AdminBookingTarget["kind"];

const TARGET_KINDS: { kind: TargetKind; label: string }[] = [
  { kind: "client", label: "studio.manage.create.forClient" },
  { kind: "guest", label: "studio.manage.create.forGuest" },
  { kind: "block", label: "studio.manage.create.forBlock" },
];

const PURPOSE_MAX = 200;
const LABEL_MAX = 60;
const CLIENT_RESULTS = 8;

const chipClass = (active: boolean) =>
  `px-3 py-1.5 text-sm rounded-sm border transition-colors ${
    active
      ? "border-accent bg-accent/20 text-white"
      : "border-white/20 text-fg-muted hover:border-accent hover:text-white"
  }`;

const fieldClass =
  "w-full px-3 py-2 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors";

// Admin's "new booking": for a client, a guest without an account, or closed time
export function AdminBookingSheet({ slot, ctx, onClose, onDone }: AdminBookingSheetProps) {
  if (!slot) return null;

  return (
    <SheetFrame onClose={onClose}>
      {(titleId) => (
        // A new slot remounts the form, so its state starts fresh
        <AdminBookingForm
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

interface AdminBookingFormProps {
  titleId: string;
  slot: HourSlot;
  ctx: SlotContext;
  onClose: () => void;
  onDone: () => void;
}

function AdminBookingForm({ titleId, slot, ctx, onClose, onDone }: AdminBookingFormProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const toast = useToast();
  const purposeId = useId();
  const counterId = useId();

  const durations = availableDurations(slot.day, slot.hour, ctx);
  const [hours, setHours] = useState(durations[0] ?? 0);
  const [kind, setKind] = useState<TargetKind>("client");
  const [clientId, setClientId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [label, setLabel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<StudioClient[] | null>(null);
  const [clientsError, setClientsError] = useState<unknown>(null);

  // Clients load once per opened sheet, whichever "for" is picked first
  useEffect(() => {
    let cancelled = false;
    fetchClients().then(
      (list) => {
        if (!cancelled) setClients(list);
      },
      (e: unknown) => {
        console.error("Failed to load clients", e);
        if (!cancelled) setClientsError(e);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // The calendar may refresh while the sheet is open and shrink the options
  const selected = durations.includes(hours) ? hours : (durations[0] ?? 0);

  const target = ((): AdminBookingTarget | null => {
    switch (kind) {
      case "client":
        return clientId ? { kind, userId: clientId } : null;
      case "guest":
        return guestName.trim() && guestPhone.trim()
          ? { kind, name: guestName.trim(), phone: guestPhone.trim() }
          : null;
      case "block":
        return { kind, label: label.trim() };
    }
  })();
  const canSubmit = selected > 0 && target !== null && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !target) return;

    setSubmitting(true);
    setError(null);
    try {
      await adminCreateBooking(target, slot.startsAt, selected, purpose.trim());
      toast.success(
        t(kind === "block" ? "studio.manage.create.closed" : "studio.manage.create.created"),
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
          {t("studio.manage.create.title")}
        </h2>
        <p className={`mt-1 ${typography.caption} first-letter:uppercase`}>
          {formatDay(slot.day, "EEEE, d MMMM", locale)} ·{" "}
          {formatStudio(slot.startsAt, "HH:mm", locale)}
        </p>
      </div>

      <fieldset>
        <legend className={`mb-2 ${typography.caption}`}>{t("studio.sheet.duration")}</legend>
        <div className="flex flex-wrap gap-2">
          {durations.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={h === selected}
              onClick={() => setHours(h)}
              className={chipClass(h === selected)}
            >
              {t("studio.sheet.hours", { count: h })}
              <span className="opacity-60">
                {" · "}
                {t("studio.sheet.until", {
                  time: `${String(slot.hour + h).padStart(2, "0")}:00`,
                })}
              </span>
            </button>
          ))}
        </div>
        {selected > 0 && (
          <p className="mt-2 text-sm text-white tabular-nums">
            {formatTimeRange(slot.startsAt, hourStart(slot.day, slot.hour + selected))}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className={`mb-2 ${typography.caption}`}>{t("studio.manage.create.for")}</legend>
        <div className="flex flex-wrap gap-2">
          {TARGET_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              aria-pressed={k.kind === kind}
              onClick={() => setKind(k.kind)}
              className={chipClass(k.kind === kind)}
            >
              {t(k.label)}
            </button>
          ))}
        </div>
      </fieldset>

      {kind === "client" && (
        <ClientPicker
          clients={clients}
          loadError={clientsError}
          selectedId={clientId}
          onSelect={setClientId}
        />
      )}

      {kind === "guest" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("studio.manage.create.guestName")}
            value={guestName}
            onChange={setGuestName}
            required
          />
          <Input
            label={t("studio.manage.create.guestPhone")}
            type="tel"
            value={guestPhone}
            onChange={setGuestPhone}
            required
          />
        </div>
      )}

      {kind === "block" && (
        <div>
          <Input
            label={t("studio.manage.create.label")}
            value={label}
            onChange={(v) => setLabel(v.slice(0, LABEL_MAX))}
            placeholder={t("studio.manage.create.labelPlaceholder")}
          />
          <div className="mt-1 flex justify-between gap-4 text-xs text-fg-muted">
            <span>{t("studio.manage.create.labelHint")}</span>
            <span className="ml-auto tabular-nums shrink-0">
              {label.length}/{LABEL_MAX}
            </span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor={purposeId} className={`block mb-2 ${typography.caption}`}>
          {t("studio.manage.create.purpose")}
        </label>
        <textarea
          id={purposeId}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value.slice(0, PURPOSE_MAX))}
          maxLength={PURPOSE_MAX}
          rows={3}
          aria-describedby={counterId}
          className={`${fieldClass} font-sans resize-y`}
        />
        <p id={counterId} className="mt-1 text-right text-xs text-fg-muted tabular-nums">
          {purpose.length}/{PURPOSE_MAX}
        </p>
      </div>

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
          ? t("studio.manage.create.submitting")
          : t(
              kind === "block" ? "studio.manage.create.submitBlock" : "studio.manage.create.submit",
            )}
      </Button>
    </form>
  );
}

interface ClientPickerProps {
  clients: StudioClient[] | null; // null while loading
  loadError: unknown;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Search over all accounts; blocked clients are shown but can't be picked
function ClientPicker({ clients, loadError, selectedId, onSelect }: ClientPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const selected = clients?.find((c) => c.id === selectedId) ?? null;
  const matches = (clients ?? []).filter((c) => matchesClient(c, query));
  // The picked client stays visible even when the query no longer matches
  const shown =
    selected && !matches.slice(0, CLIENT_RESULTS).includes(selected)
      ? [selected, ...matches.slice(0, CLIENT_RESULTS - 1)]
      : matches.slice(0, CLIENT_RESULTS);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("studio.manage.create.clientSearch")}
        aria-label={t("studio.manage.create.clientSearch")}
        className={fieldClass}
      />

      {loadError ? (
        <p role="alert" className="text-sm text-red-400">
          {t(bookingErrorKey(loadError))}
        </p>
      ) : clients === null ? (
        <p className={typography.caption}>{t("app.loading")}</p>
      ) : shown.length === 0 ? (
        <p className={typography.caption}>{t("studio.manage.create.clientNotFound")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((c) => {
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={c.blocked}
                  aria-pressed={active}
                  onClick={() => onSelect(c.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-sm border text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    active
                      ? "border-accent bg-accent/20 text-white"
                      : "border-white/10 text-fg-muted hover:border-accent hover:text-white"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white truncate">{personName(c, t)}</span>
                    {c.phone && (
                      <span className="block text-xs tabular-nums truncate">{c.phone}</span>
                    )}
                  </span>
                  <ClientBadge client={c} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!selected && clients !== null && shown.length > 0 && (
        <p className="text-xs text-fg-muted">{t("studio.manage.create.clientPick")}</p>
      )}
    </div>
  );
}
