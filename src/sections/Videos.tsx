import { useTranslation } from "react-i18next";
import { useVideos } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { SectionHeader } from "../components/ui/SectionHeader";
import { VideoEmbed } from "../components/ui/VideoEmbed";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { grids } from "../styles/layouts";

export function Videos() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = useVideos();
  const visible = videos.slice(0, 2);

  return (
    <section id="videos" className="py-24">
      <Container>
        <SectionHeader
          eyebrow={t("videos.eyebrow")}
          title={t("videos.title")}
          to="/videos"
          linkLabel={t("videos.all")}
        />
        <div className={grids.videos}>
          {visible.map((v) => (
            <Stack key={v.id} gap="sm" className="reveal">
              <VideoEmbed youtubeId={v.youtubeId} title={tr(v.title)} />
              <p className="font-display text-2xl text-fg">{tr(v.title)}</p>
            </Stack>
          ))}
        </div>
      </Container>
    </section>
  );
}
