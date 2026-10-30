import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useReleases } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { Eyebrow } from "../components/ui/Eyebrow";
import { Ornament } from "../components/ui/Ornament";
import { ParallaxDivider } from "../components/fx/ParallaxDivider";
import { ReleaseCard } from "../components/release/ReleaseCard";
import { grids } from "../styles/layouts";
import { typography } from "../styles/typography";
import { interactive } from "../styles/interactive";

export function Releases() {
  const { t } = useTranslation();
  const releases = useReleases();
  const visible = releases.slice(0, 4);

  return (
    <section id="releases" className="pb-24">
      <ParallaxDivider>
        <Eyebrow className="mb-3 text-accent">{t("releases.eyebrow")}</Eyebrow>
        <Link to="/releases" className={interactive.accentHover}>
          <h2 className={`${typography.heading} text-4xl md:text-6xl`}>{t("releases.title")}</h2>
        </Link>
        <Ornament align="center" className="mt-4" />
      </ParallaxDivider>
      <Container className="relative z-10 -mt-6">
        <div className={grids.releases}>
          {visible.map((r) => (
            <ReleaseCard key={r.id} release={r} />
          ))}
        </div>
      </Container>
    </section>
  );
}
