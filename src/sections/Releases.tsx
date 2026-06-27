import { useTranslation } from "react-i18next";
import { useReleases } from "../storage/hooks";
import { Section } from "../components/layout/Section";
import { ReleaseCard } from "../components/release/ReleaseCard";
import { grids } from "../styles/layouts";

export function Releases() {
  const { t } = useTranslation();
  const releases = useReleases();

  return (
    <Section id="releases" title={t("releases.title")}>
      <div className={grids.releases}>
        {releases.map((r) => (
          <ReleaseCard key={r.id} release={r} />
        ))}
      </div>
    </Section>
  );
}
