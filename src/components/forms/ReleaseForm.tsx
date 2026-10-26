import { useState, useMemo, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Release, StreamingLinks } from "../../types";
import { Input } from "../ui/Input";
import { LocalizedTextInput } from "../ui/LocalizedTextInput";
import { Select } from "../ui/Select";
import { FormActions } from "../ui/FormActions";
import { ImageUploadInput } from "../ui/ImageUploadInput";
import { TrackListEditor } from "./TrackListEditor";
import { typography } from "../../styles/typography";

interface ReleaseFormProps {
  initialRelease: Release;
  onSubmit: (release: Release) => Promise<void>;
  onCancel: () => void;
}

const STREAMING_FIELDS: ReadonlyArray<{
  key: keyof StreamingLinks;
  label: string;
  placeholder: string;
}> = [
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/album/..." },
  { key: "appleMusic", label: "Apple Music", placeholder: "https://music.apple.com/album/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "yandexMusic", label: "Yandex Music", placeholder: "https://music.yandex.ru/album/..." },
  { key: "vk", label: "VK", placeholder: "https://vk.com/music/album/..." },
];

export function ReleaseForm({ initialRelease, onSubmit, onCancel }: ReleaseFormProps) {
  const { t } = useTranslation();
  const [release, setRelease] = useState<Release>(initialRelease);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = useMemo(
    () => [
      { value: "album" as const, label: t("admin.releaseTypeAlbum") },
      { value: "single" as const, label: t("admin.releaseTypeSingle") },
      { value: "ep" as const, label: t("admin.releaseTypeEp") },
    ],
    [t],
  );

  const updateLink = (key: keyof StreamingLinks, value: string) => {
    const links = { ...release.links };
    if (value) {
      links[key] = value;
    } else {
      delete links[key];
    }
    setRelease({ ...release, links });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(release);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LocalizedTextInput
        label={t("admin.releaseTitle")}
        value={release.title}
        onChange={(title) => setRelease({ ...release, title })}
        required
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Select
          label={t("admin.releaseType")}
          value={release.type}
          onChange={(type) => setRelease({ ...release, type })}
          options={typeOptions}
        />
        <Input
          label={t("admin.releaseDate")}
          type="date"
          value={release.releaseDate}
          onChange={(releaseDate) => setRelease({ ...release, releaseDate })}
          required
        />
      </div>

      <ImageUploadInput
        label={t("admin.releaseCover")}
        value={release.coverUrl}
        onChange={(coverUrl) => setRelease({ ...release, coverUrl })}
      />

      <LocalizedTextInput
        label={t("admin.releaseDescription")}
        value={release.description}
        onChange={(description) => setRelease({ ...release, description })}
        multiline
        rows={3}
      />

      <div>
        <div className={`mb-3 ${typography.caption}`}>{t("admin.streamingLinks")}</div>
        <div className="space-y-3">
          {STREAMING_FIELDS.map(({ key, label, placeholder }) => (
            <Input
              key={key}
              label={label}
              type="url"
              value={release.links[key] ?? ""}
              onChange={(v) => updateLink(key, v)}
              placeholder={placeholder}
            />
          ))}
        </div>
      </div>

      <TrackListEditor
        tracks={release.tracks}
        onChange={(tracks) => setRelease({ ...release, tracks })}
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
