import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Profile, ProfileInput } from "../../types";
import { Input } from "../ui/Input";
import { Checkbox } from "../ui/Checkbox";
import { FormActions } from "../ui/FormActions";
import { typography } from "../../styles/typography";

interface ProfileFormProps {
  initial: Profile;
  onSubmit: (input: ProfileInput) => Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
}

const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
// Same rule as the CHECK constraint on profiles.telegram_username
const TELEGRAM_RE = /^[A-Za-z0-9_]{5,32}$/;

export function ProfileForm({ initial, onSubmit, onCancel, cancelLabel }: ProfileFormProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [telegram, setTelegram] = useState(initial.telegramUsername);
  const [showFullName, setShowFullName] = useState(initial.showFullName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const telegramUsername = telegram.trim().replace(/^@/, "");

    if (!PHONE_RE.test(phone.trim())) {
      setError(t("profile.invalidPhone"));
      return;
    }
    if (telegramUsername && !TELEGRAM_RE.test(telegramUsername)) {
      setError(t("profile.invalidTelegram"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        telegramUsername,
        showFullName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className={typography.caption}>{t("profile.intro")}</p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Input
          label={t("profile.firstName")}
          value={firstName}
          onChange={setFirstName}
          required
        />
        <Input label={t("profile.lastName")} value={lastName} onChange={setLastName} required />
      </div>

      <Input
        label={t("profile.phone")}
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="+375 29 123-45-67"
        required
      />

      <Input
        label={t("profile.telegram")}
        value={telegram}
        onChange={setTelegram}
        placeholder="@username"
      />

      <Checkbox
        label={t("profile.showFullName")}
        checked={showFullName}
        onChange={setShowFullName}
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions onCancel={onCancel} cancelLabel={cancelLabel} submitting={submitting} />
    </form>
  );
}
