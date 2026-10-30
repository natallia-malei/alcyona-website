import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Concert, ConcertStatus } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { LocalizedTextInput } from "../ui/LocalizedTextInput";
import { FormActions } from "../ui/FormActions";

interface ConcertFormProps {
  initialConcert?: Concert;
  onSubmit: (concert: Concert) => Promise<void>;
  onCancel: () => void;
}

const STATUSES: ConcertStatus[] = ["on_sale", "announced", "sold_out", "cancelled"];

const EMPTY_CONCERT: Concert = {
  id: "",
  date: "",
  time: "",
  city: { ru: "", en: "" },
  venue: "",
  status: "on_sale",
  ticketUrl: "",
  vipUrl: "",
  videoUrl: "",
};

export function ConcertForm({ initialConcert, onSubmit, onCancel }: ConcertFormProps) {
  const { t } = useTranslation();
  const [concert, setConcert] = useState<Concert>(initialConcert ?? EMPTY_CONCERT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Concert>(key: K, value: Concert[K]) =>
    setConcert((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...concert,
        venue: concert.venue.trim(),
        ticketUrl: concert.ticketUrl.trim(),
        vipUrl: concert.vipUrl.trim(),
        videoUrl: concert.videoUrl.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label={t("concerts.form.date")}
          type="date"
          value={concert.date}
          onChange={(date) => set("date", date)}
          required
        />
        <Input
          label={t("concerts.form.time")}
          type="time"
          value={concert.time}
          onChange={(time) => set("time", time)}
        />
      </div>

      <LocalizedTextInput
        label={t("concerts.form.city")}
        value={concert.city}
        onChange={(city) => set("city", city)}
        required
      />

      <Input
        label={t("concerts.form.venue")}
        value={concert.venue}
        onChange={(venue) => set("venue", venue)}
        required
      />

      <Select<ConcertStatus>
        label={t("concerts.form.status")}
        value={concert.status}
        onChange={(status) => set("status", status)}
        options={STATUSES.map((value) => ({ value, label: t(`concerts.status.${value}`) }))}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label={t("concerts.form.ticketUrl")}
          type="url"
          value={concert.ticketUrl}
          onChange={(ticketUrl) => set("ticketUrl", ticketUrl)}
          placeholder="https://..."
        />
        <Input
          label={t("concerts.form.vipUrl")}
          type="url"
          value={concert.vipUrl}
          onChange={(vipUrl) => set("vipUrl", vipUrl)}
          placeholder="https://..."
        />
      </div>

      <Input
        label={t("concerts.form.videoUrl")}
        type="url"
        value={concert.videoUrl}
        onChange={(videoUrl) => set("videoUrl", videoUrl)}
        placeholder="https://youtube.com/watch?v=..."
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
