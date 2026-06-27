import { useTranslation } from "react-i18next";
import { usePhotos } from "../storage/hooks";
import { Section } from "../components/layout/Section";
import { MediaFrame } from "../components/ui/MediaFrame";
import { MediaImage } from "../components/ui/MediaImage";
import { grids } from "../styles/layouts";

export function Photos() {
  const { t } = useTranslation();
  const photos = usePhotos();

  return (
    <Section id="photos" title={t("photos.title")}>
      <div className={grids.photos}>
        {photos.map((p) => (
          <MediaFrame key={p.id}>
            <MediaImage src={p.url} alt="" zoom="hover" />
          </MediaFrame>
        ))}
      </div>
    </Section>
  );
}
