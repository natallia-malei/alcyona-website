import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Track } from "../../types";
import { LocalizedTextInput } from "../ui/LocalizedTextInput";
import { CloseIcon } from "../icons/CloseIcon";
import { GripIcon } from "../icons/GripIcon";
import { formatDuration } from "../../utils/formatDuration";
import { parseDuration } from "../../utils/parseDuration";
import { typography } from "../../styles/typography";

interface TrackRowProps {
  track: Track;
  index: number;
  onChange: (track: Track) => void;
  onDelete: () => void;
}

export function TrackRow({ track, index, onChange, onDelete }: TrackRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });
  const [durationInput, setDurationInput] = useState(
    track.durationSec > 0 ? formatDuration(track.durationSec) : "",
  );
  const [durationError, setDurationError] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const commitDuration = () => {
    if (!durationInput.trim()) {
      setDurationError(false);
      onChange({ ...track, durationSec: 0 });
      return;
    }
    const sec = parseDuration(durationInput);
    if (sec == null) {
      setDurationError(true);
      return;
    }
    setDurationError(false);
    setDurationInput(formatDuration(sec));
    onChange({ ...track, durationSec: sec });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none border border-white/10 rounded-sm bg-bg p-3 space-y-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="text-fg-muted hover:text-white cursor-grab active:cursor-grabbing p-1"
        >
          <GripIcon />
        </button>
        <span className={`${typography.eyebrowXs} text-fg-muted min-w-[2ch]`}>
          #{index + 1}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2">
            <span className={typography.caption}>Duration</span>
            <input
              type="text"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              onBlur={commitDuration}
              placeholder="3:45"
              className={`w-20 px-2 py-1 bg-bg border rounded-sm text-white text-sm focus:outline-none transition-colors ${
                durationError
                  ? "border-red-500 focus:border-red-400"
                  : "border-white/20 focus:border-accent"
              }`}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowLyrics((v) => !v)}
            className="text-xs text-fg-muted hover:text-white transition-colors px-2 py-1 border border-white/10 rounded-sm"
          >
            {showLyrics ? "Hide lyrics" : "Lyrics"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete track"
            className="p-1 text-fg-muted hover:text-accent transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <LocalizedTextInput
        label="Title"
        value={track.title}
        onChange={(title) => onChange({ ...track, title })}
      />

      {showLyrics && (
        <LocalizedTextInput
          label="Lyrics"
          value={track.lyrics}
          onChange={(lyrics) => onChange({ ...track, lyrics })}
          multiline
          rows={6}
        />
      )}
    </div>
  );
}
