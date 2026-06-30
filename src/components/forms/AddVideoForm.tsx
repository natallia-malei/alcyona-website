import { useState, type FormEvent } from "react";
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
      setError("Invalid YouTube URL");
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
      setError(err instanceof Error ? err.message : "Failed to fetch video metadata");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoId) {
      setError("Paste a valid YouTube URL first");
      return;
    }
    if (!title.ru.trim() || !title.en.trim()) {
      setError("Title required in both RU and EN");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(videoId, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="YouTube URL"
        type="url"
        value={url}
        onChange={setUrl}
        onBlur={handleUrlBlur}
        placeholder="https://youtube.com/watch?v=..."
        required
      />
      {parsing && <p className={typography.caption}>Fetching video info…</p>}
      {videoId && (
        <p className={typography.caption}>
          Detected video ID: <span className="text-white">{videoId}</span>
        </p>
      )}

      <LocalizedTextInput
        label="Title"
        value={title}
        onChange={setTitle}
        required
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
          {error}
        </p>
      )}

      <FormActions onCancel={onCancel} submitLabel="Add video" submitting={submitting} />
    </form>
  );
}
