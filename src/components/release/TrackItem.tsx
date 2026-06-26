import { useTranslation } from "react-i18next";
import type { Track } from "../../types";
import { useLocalizedText } from "../../hooks/useLocalizedText";
import { formatDuration } from "../../utils/formatDuration";
import { typography } from "../../styles/typography";

interface TrackItemProps {
  track: Track;
  index: number;
}

export function TrackItem({ track, index }: TrackItemProps) {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const lyrics = tr(track.lyrics);

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg text-white">
          <span className="text-fg-muted mr-3">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          {tr(track.title)}
        </p>
        <p className="text-sm tabular-nums">
          {formatDuration(track.durationSec)}
        </p>
      </div>
      {lyrics && (
        <details className="mt-3">
          <summary className={`${typography.eyebrow} text-fg-muted cursor-pointer hover:text-white`}>
            {t("release.lyrics")}
          </summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-fg-muted leading-relaxed">
            {lyrics}
          </pre>
        </details>
      )}
    </li>
  );
}
