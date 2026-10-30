import { useTranslation } from "react-i18next";
import type { Release } from "../../types";

interface ReleaseMetaProps {
  release: Release;
}

/** «Сингл · 2026» на языке посетителя. */
export function ReleaseMeta({ release }: ReleaseMetaProps) {
  const { t } = useTranslation();
  return (
    <>
      {t(`releases.types.${release.type}`)} · {new Date(release.releaseDate).getFullYear()}
    </>
  );
}
