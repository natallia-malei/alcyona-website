import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useVideos } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Eyebrow } from "../components/ui/Eyebrow";
import { VideoEmbed } from "../components/ui/VideoEmbed";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { grids } from "../styles/layouts";
import { interactive } from "../styles/interactive";

export function Videos() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = useVideos();
  const visible = videos.slice(0, 2);

  return (
    <section id="videos" className="py-20">
      <Container>
        <Link to="/videos" className={`inline-block mb-10 ${interactive.accentHover}`}>
          <SectionTitle>{t("videos.title")}</SectionTitle>
        </Link>
        <div className={grids.videos}>
          {visible.map((v) => (
            <Stack key={v.id} gap="sm">
              <VideoEmbed youtubeId={v.youtubeId} title={tr(v.title)} />
              <Eyebrow className="text-fg-muted">{tr(v.title)}</Eyebrow>
            </Stack>
          ))}
        </div>
      </Container>
    </section>
  );
}
