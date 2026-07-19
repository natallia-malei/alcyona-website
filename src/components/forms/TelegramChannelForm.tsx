import { useState, type FormEvent } from "react";
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
      setError(err instanceof Error ? err.message : "Failed to save");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Telegram channel URL"
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
