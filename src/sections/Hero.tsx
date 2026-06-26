import { useTranslation } from "react-i18next";
import { getFeaturedRelease } from "../storage";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/PageTitle";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { Eyebrow } from "../components/Eyebrow";
import { PlatformLink } from "../components/PlatformLink";
import { HeroBackdrop } from "../components/HeroBackdrop";
import { ReleaseCover } from "../components/ReleaseCover";
import { Lead } from "../components/Lead";

export function Hero() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const release = getFeaturedRelease();

  if (!release) return null;

  return (
    <HeroBackdrop coverUrl={release.coverUrl}>
      <Container className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <ReleaseCover coverUrl={release.coverUrl} alt={tr(release.title)} size="lg" />
        <div>
          <Eyebrow tracking="extra" className="text-accent mb-4">
            {release.type === "album" ? "New Album" : "New Release"}
          </Eyebrow>
          <PageTitle size="hero" className="mb-6">
            {tr(release.title)}
          </PageTitle>
          <Lead className="mb-8 max-w-xl">{tr(release.description)}</Lead>
          <div className="flex flex-wrap items-center gap-4">
            <Button to={`/release/${release.id}`}>{t("hero.listenNow")}</Button>
            {release.links.spotify && (
              <PlatformLink href={release.links.spotify}>Spotify →</PlatformLink>
            )}
            {release.links.appleMusic && (
              <PlatformLink href={release.links.appleMusic}>Apple Music →</PlatformLink>
            )}
          </div>
        </div>
      </Container>
    </HeroBackdrop>
  );
}
