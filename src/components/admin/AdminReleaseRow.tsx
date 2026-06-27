import type { Release } from "../../types";
import { useLocalizedText } from "../../hooks/useLocalizedText";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface AdminReleaseRowProps {
  release: Release;
  onDelete: (id: string) => void;
}

export function AdminReleaseRow({ release, onDelete }: AdminReleaseRowProps) {
  const tr = useLocalizedText();

  return (
    <li className="py-3 flex items-center justify-between">
      <span>
        {tr(release.title)}{" "}
        <span className={typography.caption}>
          · {release.type} · {release.releaseDate}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onDelete(release.id)}
        className={`${typography.caption} ${interactive.accentHover}`}
      >
        Delete
      </button>
    </li>
  );
}
