import { Link } from "react-router-dom";
import type { Release } from "../types";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { Eyebrow } from "./Eyebrow";
import { MediaFrame } from "./MediaFrame";
import { MediaImage } from "./MediaImage";

interface ReleaseCardProps {
  release: Release;
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  const tr = useLocalizedText();

  return (
    <Link to={`/release/${release.id}`} className="group block">
      <MediaFrame className="mb-3">
        <MediaImage src={release.coverUrl} alt={tr(release.title)} zoom="group-hover" />
      </MediaFrame>
      <Eyebrow size="xs" className="text-fg-muted">
        {release.type} · {new Date(release.releaseDate).getFullYear()}
      </Eyebrow>
      <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
        {tr(release.title)}
      </h3>
    </Link>
  );
}
