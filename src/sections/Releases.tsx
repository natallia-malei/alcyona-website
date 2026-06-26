import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getReleases } from "../storage";
import { Section } from "../components/Section";
import { Eyebrow } from "../components/Eyebrow";
import { useLocalizedText } from "../hooks/useLocalizedText";

export function Releases() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const releases = getReleases();

  return (
    <Section id="releases" title={t("releases.title")}>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {releases.map((r) => (
          <Link
            key={r.id}
            to={`/release/${r.id}`}
            className="group block"
          >
            <div className="aspect-square overflow-hidden bg-[--color-bg-elevated] mb-3">
              <img
                src={r.coverUrl}
                alt={tr(r.title)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <Eyebrow size="xs" className="text-[--color-fg-muted]">
              {r.type} · {new Date(r.releaseDate).getFullYear()}
            </Eyebrow>
            <h3 className="text-lg font-semibold group-hover:text-[--color-accent] transition-colors">
              {tr(r.title)}
            </h3>
          </Link>
        ))}
      </div>
    </Section>
  );
}
