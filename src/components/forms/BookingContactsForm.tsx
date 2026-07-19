import { useState, type FormEvent } from "react";
import type { BandInfo, SocialLinks } from "../../types";
import { Input } from "../ui/Input";
import { FormActions } from "../ui/FormActions";
import { typography } from "../../styles/typography";

interface BookingContactsFormProps {
  initialBand: BandInfo;
  onSubmit: (band: BandInfo) => Promise<void>;
  onCancel: () => void;
}

const SOCIAL_FIELDS: ReadonlyArray<{
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "vk", label: "VK", placeholder: "https://vk.com/..." },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
];

export function BookingContactsForm({
  initialBand,
  onSubmit,
  onCancel,
}: BookingContactsFormProps) {
  const [band, setBand] = useState<BandInfo>(initialBand);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSocial = (key: keyof SocialLinks, value: string) => {
    const social = { ...band.social };
    if (value.trim()) {
      social[key] = value.trim();
    } else {
      delete social[key];
    }
    setBand({ ...band, social });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...band, bookingEmail: band.bookingEmail.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Booking email"
        type="email"
        value={band.bookingEmail}
        onChange={(bookingEmail) => setBand({ ...band, bookingEmail })}
        placeholder="booking@example.com"
        required
      />

      <div>
        <div className={`mb-3 ${typography.caption}`}>Social links</div>
        <div className="space-y-3">
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <Input
              key={key}
              label={label}
              type="url"
              value={band.social[key] ?? ""}
              onChange={(v) => updateSocial(key, v)}
              placeholder={placeholder}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
