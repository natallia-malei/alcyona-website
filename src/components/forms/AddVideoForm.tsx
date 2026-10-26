import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LocalizedText } from "../../types";
import { extractYouTubeId, fetchYouTubeMeta } from "../../utils/youtube";
import { Input } from "../ui/Input";
import { LocalizedTextInput } from "../ui/LocalizedTextInput";
import { FormActions } from "../ui/FormActions";
import { typography } from "../../styles/typography";

interface AddVideoFormProps {
  onSubmit: (youtubeId: string, title: LocalizedText) => Promise<void>;
  onCancel: () => void;
}

export function AddVideoForm({ onSubmit, onCancel }: AddVideoFormProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState<LocalizedText>({ ru: "", en: "" });
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlBlur = async () => {
    if (!url.trim()) return;
    const id = extractYouTubeId(url);
    if (!id) {
      setError(t("admin.videoUrlInvalid"));
      setVideoId("");
      return;
    }
    setError(null);
    setVideoId(id);
    setParsing(true);
    try {
      const meta = await fetchYouTubeMeta(url);
      if (meta.title) {
        setTitle({ ru: meta.title, en: meta.title });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.videoMetaFailed"));
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoId) {
      setError(t("admin.videoUrlInvalid"));
      return;
    }
    if (!title.ru.trim() || !title.en.trim()) {
      setError(t("admin.videoTitleRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(videoId, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.videoAddFailed"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t("admin.videoUrl")}
        type="url"
        value={url}
        onChange={setUrl}
        onBlur={handleUrlBlur}
        placeholder="https://youtube.com/watch?v=..."
        required
      />
      {parsing && <p className={typography.caption}>{t("admin.videoFetching")}</p>}
      {videoId && (
        <p className={typography.caption}>
          {t("admin.videoIdDetected")} <span className="text-white">{videoId}</span>
        </p>
      )}

      <LocalizedTextInput label={t("admin.videoTitle")} value={title} onChange={setTitle} required />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions
        onCancel={onCancel}
        submitLabel={t("common.add")}
        submitting={submitting}
      />
    </form>
  );
}
