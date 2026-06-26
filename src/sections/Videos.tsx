import { useTranslation } from "react-i18next";
import { getVideos } from "../storage";
import { Section } from "../components/Section";
import { Eyebrow } from "../components/Eyebrow";
import { useLocalizedText } from "../hooks/useLocalizedText";

export function Videos() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = getVideos();

  return (
    <Section id="videos" title={t("videos.title")}>
      <div className="grid md:grid-cols-2 gap-6">
        {videos.map((v) => (
          <div key={v.id}>
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${v.youtubeId}`}
                title={tr(v.title)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <Eyebrow className="mt-3 text-fg-muted">
              {tr(v.title)}
            </Eyebrow>
          </div>
        ))}
      </div>
    </Section>
  );
}
