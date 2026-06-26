import { useTranslation } from "react-i18next";
import type { Release } from "../types";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/PageTitle";
import { SectionTitle } from "../components/SectionTitle";
import { Eyebrow } from "../components/Eyebrow";
import { ReleaseLinks } from "../components/ReleaseLinks";
import { TrackList } from "../components/TrackList";
import { ReleaseCover } from "../components/ReleaseCover";
import { grids } from "../styles/layouts";

interface ReleaseDetailProps {
  release: Release;
}

export function ReleaseDetail({ release }: ReleaseDetailProps) {
  const { t } = useTranslation();
  const tr = useLocalizedText();

  return (
    <div className={`${grids.releaseDetail} mt-8`}>
      <div>
        <ReleaseCover coverUrl={release.coverUrl} alt={tr(release.title)} />
        <ReleaseLinks links={release.links} className="mt-6" />
      </div>

      <div>
        <Eyebrow tracking="extra" className="text-accent mb-2">
          {release.type} · {new Date(release.releaseDate).getFullYear()}
        </Eyebrow>
        <PageTitle className="mb-6">{tr(release.title)}</PageTitle>
        <p className="mb-10">{tr(release.description)}</p>

        <SectionTitle size="sm" className="mb-4">{t("release.tracks")}</SectionTitle>
        <TrackList tracks={release.tracks} />
      </div>
    </div>
  );
}
