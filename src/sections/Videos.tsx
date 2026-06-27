import { useTranslation } from "react-i18next";
import { useVideos } from "../storage/hooks";
import { Section } from "../components/layout/Section";
import { Stack } from "../components/layout/Stack";
import { Eyebrow } from "../components/ui/Eyebrow";
import { VideoEmbed } from "../components/ui/VideoEmbed";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { grids } from "../styles/layouts";

export function Videos() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = useVideos();

  return (
    <Section id="videos" title={t("videos.title")}>
      <div className={grids.videos}>
        {videos.map((v) => (
          <Stack key={v.id} gap="sm">
            <VideoEmbed youtubeId={v.youtubeId} title={tr(v.title)} />
            <Eyebrow className="text-fg-muted">{tr(v.title)}</Eyebrow>
          </Stack>
        ))}
      </div>
    </Section>
  );
}
