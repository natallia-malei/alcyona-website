import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { StudioSettings } from "../../../types";
import { bookingErrorKey, fetchStudioSettings } from "../../../supabase/bookings";
import { updateStudioSettings } from "../../../supabase/manage";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";
import {
  SETTINGS_GROUPS,
  settingsChanged,
  toForm,
  validateSettings,
  type SettingsField,
  type SettingsForm,
} from "./SettingsValidation";

// Booking rules for clients (studio_settings). Validation mirrors the DB CHECKs.
export function SettingsTab() {
  const { t } = useTranslation();
  const toast = useToast();

  const [loaded, setLoaded] = useState<StudioSettings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  // No reload on focus: it would wipe unsaved edits
  const load = useCallback(() => {
    const id = ++requestId.current;
    fetchStudioSettings().then(
      (settings) => {
        if (id !== requestId.current) return;
        setLoaded(settings);
        setForm(toForm(settings));
        setError(null);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        console.error("Failed to load studio settings", e);
        setError(e);
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded || !form) {
    return error ? (
      <div className="flex flex-wrap items-center gap-4">
        <p role="alert" className="text-sm text-red-400">
          {t("studio.manage.loadFailed")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            load();
          }}
        >
          {t("studio.manage.retry")}
        </Button>
      </div>
    ) : (
      <SettingsSkeleton />
    );
  }

  const { values, groupErrors, invalidFields } = validateSettings(form);
  const changed = settingsChanged(form, loaded);
  const valid = values !== null && invalidFields.size === 0;

  const setField = (field: SettingsField, value: string) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !values || !changed || saving) return;

    setSaving(true);
    try {
      const saved = await updateStudioSettings(values);
      setLoaded(saved);
      setForm(toForm(saved));
      toast.success(t("studio.manage.settings.saved"));
    } catch (err) {
      toast.error(t(bookingErrorKey(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-8">
      <p className={typography.caption}>{t("studio.manage.settings.hint")}</p>

      {SETTINGS_GROUPS.map((group) => {
        const messages = groupErrors[group.id] ?? [];
        const errorId = `settings-${group.id}-error`;
        return (
          <fieldset key={group.id} className="flex flex-col gap-4">
            <legend className={`mb-4 ${typography.eyebrow} text-accent`}>
              {t(`studio.manage.settings.groups.${group.id}`)}
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <SettingsNumberField
                  key={field}
                  label={t(`studio.manage.settings.${field}`)}
                  value={form[field]}
                  invalid={invalidFields.has(field)}
                  errorId={messages.length > 0 ? errorId : undefined}
                  max={field === "openHour" || field === "closeHour" ? 24 : undefined}
                  disabled={saving}
                  onChange={(v) => setField(field, v)}
                />
              ))}
            </div>
            {messages.length > 0 && (
              <div id={errorId} role="alert" className="flex flex-col gap-1">
                {messages.map((key) => (
                  <p key={key} className="text-sm text-red-400">
                    {t(`studio.manage.settings.invalid.${key}`)}
                  </p>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          variant="outline"
          size="sm"
          disabled={!changed || saving}
          onClick={() => setForm(toForm(loaded))}
        >
          {t("studio.manage.settings.reset")}
        </Button>
        <Button size="sm" type="submit" disabled={!changed || !valid || saving}>
          {t(saving ? "studio.manage.settings.saving" : "studio.manage.settings.save")}
        </Button>
      </div>
    </form>
  );
}

interface SettingsNumberFieldProps {
  label: string;
  value: string;
  invalid: boolean;
  errorId?: string;
  max?: number;
  disabled: boolean;
  onChange: (value: string) => void;
}

// Integer input with an error state (ui/Input has none)
function SettingsNumberField({
  label,
  value,
  invalid,
  errorId,
  max,
  disabled,
  onChange,
}: SettingsNumberFieldProps) {
  return (
    <label className="block">
      <span className={`block mb-2 ${typography.caption}`}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        step={1}
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className={`w-full px-3 py-2 bg-bg border rounded-sm text-white tabular-nums focus:outline-none transition-colors disabled:opacity-60 ${
          invalid ? "border-red-500/70 focus:border-red-400" : "border-white/20 focus:border-accent"
        }`}
      />
    </label>
  );
}

function SettingsSkeleton() {
  const { t } = useTranslation();
  const block = "rounded-sm bg-white/5 animate-pulse";
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">{t("app.loading")}</span>
      <div className={`${block} h-5 w-3/4`} />
      {Array.from({ length: SETTINGS_GROUPS.length }, (_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className={`${block} h-4 w-40`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${block} h-16`} />
            <div className={`${block} h-16`} />
          </div>
        </div>
      ))}
    </div>
  );
}
