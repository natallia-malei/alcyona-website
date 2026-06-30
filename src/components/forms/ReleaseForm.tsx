import { useState, type FormEvent } from "react";
import type { Release, StreamingLinks } from "../../types";
import { Input } from "../ui/Input";
import { LocalizedTextInput } from "../ui/LocalizedTextInput";
import { Select } from "../ui/Select";
import { FormActions } from "../ui/FormActions";
import { ImageUploadInput } from "../ui/ImageUploadInput";
import { typography } from "../../styles/typography";

interface ReleaseFormProps {
  initialRelease: Release;
  onSubmit: (release: Release) => Promise<void>;
  onCancel: () => void;
}

const typeOptions = [
  { value: "album" as const, label: "Album" },
  { value: "single" as const, label: "Single" },
  { value: "ep" as const, label: "EP" },
];

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
  const [release, setRelease] = useState<Release>(initialRelease);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LocalizedTextInput
        label="Title"
        value={release.title}
        onChange={(title) => setRelease({ ...release, title })}
        required
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={release.type}
          onChange={(type) => setRelease({ ...release, type })}
          options={typeOptions}
        />
        <Input
          label="Release date"
          type="date"
          value={release.releaseDate}
          onChange={(releaseDate) => setRelease({ ...release, releaseDate })}
          required
        />
      </div>

      <ImageUploadInput
        label="Cover"
        value={release.coverUrl}
        onChange={(coverUrl) => setRelease({ ...release, coverUrl })}
      />

      <LocalizedTextInput
        label="Description"
        value={release.description}
        onChange={(description) => setRelease({ ...release, description })}
        multiline
        rows={3}
      />

      <div>
        <div className={`mb-3 ${typography.caption}`}>Streaming links</div>
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

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
