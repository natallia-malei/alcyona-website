import { useTranslation } from "react-i18next";
import { getReleases } from "../storage";
import { Section } from "../components/Section";
import { ReleaseCard } from "../components/ReleaseCard";

export function Releases() {
  const { t } = useTranslation();
  const releases = getReleases();

  return (
    <Section id="releases" title={t("releases.title")}>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {releases.map((r) => (
          <ReleaseCard key={r.id} release={r} />
        ))}
      </div>
    </Section>
  );
}
