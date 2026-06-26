import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getReleaseById } from "../storage";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/PageTitle";
import { Container } from "../components/Container";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReleasePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const release = id ? getReleaseById(id) : undefined;

  if (!release) {
    return (
      <Container className="pt-32 min-h-screen">
        <p className="text-[--color-fg-muted]">Release not found.</p>
        <Link to="/" className="underline">← Home</Link>
      </Container>
    );
  }

  return (
    <Container className="pt-32 pb-20">
      <Link
        to="/#releases"
        className="text-sm uppercase tracking-widest text-[--color-fg-muted] hover:text-white"
      >
        ← {t("release.back")}
      </Link>

      <div className="mt-8 grid md:grid-cols-[1fr_2fr] gap-12">
        <div>
          <img
            src={release.coverUrl}
            alt={tr(release.title)}
            className="w-full shadow-2xl"
          />
          <div className="mt-6 flex flex-col gap-2">
            {release.links.spotify && (
              <a
                href={release.links.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-widest hover:text-[--color-accent]"
              >
                Spotify →
              </a>
            )}
            {release.links.appleMusic && (
              <a
                href={release.links.appleMusic}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-widest hover:text-[--color-accent]"
              >
                Apple Music →
              </a>
            )}
            {release.links.youtube && (
              <a
                href={release.links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-widest hover:text-[--color-accent]"
              >
                YouTube →
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[--color-accent] mb-2">
            {release.type} · {new Date(release.releaseDate).getFullYear()}
          </p>
          <PageTitle className="mb-6">{tr(release.title)}</PageTitle>
          <p className="text-[--color-fg-muted] mb-10">{tr(release.description)}</p>

          <h2 className="text-2xl font-bold mb-4">{t("release.tracks")}</h2>
          <ol className="divide-y divide-white/10">
            {release.tracks.map((track, idx) => (
              <li key={track.id} className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-lg">
                    <span className="text-[--color-fg-muted] mr-3">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    {tr(track.title)}
                  </p>
                  <p className="text-sm text-[--color-fg-muted] tabular-nums">
                    {formatDuration(track.durationSec)}
                  </p>
                </div>
                {tr(track.lyrics) && (
                  <details className="mt-3">
                    <summary className="text-sm uppercase tracking-widest text-[--color-fg-muted] cursor-pointer hover:text-white">
                      {t("release.lyrics")}
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-[--color-fg-muted] leading-relaxed">
                      {tr(track.lyrics)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Container>
  );
}
