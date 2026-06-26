import { useTranslation } from "react-i18next";
import { getFeaturedRelease } from "../storage";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/PageTitle";
import { Button } from "../components/Button";

export function Hero() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const release = getFeaturedRelease();

  if (!release) return null;

  return (
    <section
      id="new-album"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 blur-sm opacity-40"
        style={{ backgroundImage: `url(${release.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={release.coverUrl}
          alt={tr(release.title)}
          className="w-full max-w-md mx-auto shadow-2xl rounded-sm"
        />
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[--color-accent] mb-4">
            {release.type === "album" ? "New Album" : "New Release"}
          </p>
          <PageTitle size="hero" className="mb-6">
            {tr(release.title)}
          </PageTitle>
          <p className="text-lg text-[--color-fg-muted] mb-8 max-w-xl">
            {tr(release.description)}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button to={`/release/${release.id}`}>{t("hero.listenNow")}</Button>
            {release.links.spotify && (
              <a
                href={release.links.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-widest hover:text-[--color-accent] transition-colors"
              >
                Spotify →
              </a>
            )}
            {release.links.appleMusic && (
              <a
                href={release.links.appleMusic}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-widest hover:text-[--color-accent] transition-colors"
              >
                Apple Music →
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
