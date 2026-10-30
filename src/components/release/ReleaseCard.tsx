import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Release } from "../../types";
import { useLocalizedText } from "../../hooks/useLocalizedText";
import { Eyebrow } from "../ui/Eyebrow";
import { MediaFrame } from "../ui/MediaFrame";
import { MediaImage } from "../ui/MediaImage";
import { Filigree } from "../fx/Filigree";
import { releaseCoverTransition } from "./releaseTransition";
import { ReleaseMeta } from "./ReleaseMeta";

interface ReleaseCardProps {
  release: Release;
}

/** Карточка релиза: при наведении прорисовывается золотая рамка, обложка перелетает на страницу релиза. */
export function ReleaseCard({ release }: ReleaseCardProps) {
  const { t } = useTranslation();
  const tr = useLocalizedText();

  return (
    <Link
      to={`/release/${release.id}`}
      viewTransition
      className="reveal group relative block bg-bg-elevated/60 p-2 outline-none md:p-3"
    >
      <Filigree />
      <MediaFrame>
        <MediaImage
          src={release.coverUrl}
          alt=""
          zoom="group-hover"
          transitionName={releaseCoverTransition(release.id)}
        />
      </MediaFrame>
      <div className="mt-3 space-y-1.5 px-1 pb-1 md:mt-4 md:space-y-2">
        <Eyebrow size="xs" className="text-fg-muted">
          <ReleaseMeta release={release} />
        </Eyebrow>
        <h3 className="font-display text-xl font-semibold leading-tight md:text-2xl transition-colors group-hover:text-accent-hi">
          {tr(release.title)}
        </h3>
        <span
          aria-hidden="true"
          className="inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-accent/60 transition duration-500 group-hover:translate-x-1 group-hover:text-accent-hi group-focus-visible:translate-x-1 group-focus-visible:text-accent-hi"
        >
          {t("releases.open")} →
        </span>
      </div>
    </Link>
  );
}
