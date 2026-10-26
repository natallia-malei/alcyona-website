import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../ui/Input";
import { FormActions } from "../ui/FormActions";

interface TelegramChannelFormProps {
  initialValue: string;
  onSubmit: (url: string) => Promise<void>;
  onCancel: () => void;
}

export function TelegramChannelForm({
  initialValue,
  onSubmit,
  onCancel,
}: TelegramChannelFormProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t("admin.telegramUrl")}
        type="url"
        value={url}
        onChange={setUrl}
        placeholder="https://t.me/..."
        required
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
