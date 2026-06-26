import { Link } from "react-router-dom";
import type { Release } from "../types";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { Eyebrow } from "./Eyebrow";

interface ReleaseCardProps {
  release: Release;
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  const tr = useLocalizedText();

  return (
    <Link to={`/release/${release.id}`} className="group block">
      <div className="aspect-square overflow-hidden bg-[--color-bg-elevated] mb-3">
        <img
          src={release.coverUrl}
          alt={tr(release.title)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <Eyebrow size="xs" className="text-[--color-fg-muted]">
        {release.type} · {new Date(release.releaseDate).getFullYear()}
      </Eyebrow>
      <h3 className="text-lg font-semibold group-hover:text-[--color-accent] transition-colors">
        {tr(release.title)}
      </h3>
    </Link>
  );
}
