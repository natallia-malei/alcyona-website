import type { Release } from "../types";
import { useLocalizedText } from "../hooks/useLocalizedText";

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
        <span className="text-fg-muted text-sm">
          · {release.type} · {release.releaseDate}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onDelete(release.id)}
        className="text-sm text-fg-muted hover:text-accent"
      >
        Delete
      </button>
    </li>
  );
}
