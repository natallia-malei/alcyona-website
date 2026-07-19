import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useReleases } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { SectionTitle } from "../components/ui/SectionTitle";
import { ReleaseCard } from "../components/release/ReleaseCard";
import { grids } from "../styles/layouts";
import { interactive } from "../styles/interactive";

export function Releases() {
  const { t } = useTranslation();
  const releases = useReleases();
  const visible = releases.slice(0, 4);

  return (
    <section id="releases" className="py-20">
      <Container>
        <Link to="/releases" className={`inline-block mb-10 ${interactive.accentHover}`}>
          <SectionTitle>{t("releases.title")}</SectionTitle>
        </Link>
        <div className={grids.releases}>
          {visible.map((r) => (
            <ReleaseCard key={r.id} release={r} />
          ))}
        </div>
      </Container>
    </section>
  );
}
