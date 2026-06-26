import { useTranslation } from "react-i18next";
import { getVideos } from "../storage";
import { Section } from "../components/layout/Section";
import { Eyebrow } from "../components/ui/Eyebrow";
import { VideoEmbed } from "../components/ui/VideoEmbed";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { grids } from "../styles/layouts";

export function Videos() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = getVideos();

  return (
    <Section id="videos" title={t("videos.title")}>
      <div className={grids.videos}>
        {videos.map((v) => (
          <div key={v.id}>
            <VideoEmbed youtubeId={v.youtubeId} title={tr(v.title)} />
            <Eyebrow className="mt-3 text-fg-muted">
              {tr(v.title)}
            </Eyebrow>
          </div>
        ))}
      </div>
    </Section>
  );
}
