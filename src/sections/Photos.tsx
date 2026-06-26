import { useTranslation } from "react-i18next";
import { getPhotos } from "../storage";
import { Section } from "../components/Section";
import { MediaFrame } from "../components/MediaFrame";
import { MediaImage } from "../components/MediaImage";
import { grids } from "../styles/layouts";

export function Photos() {
  const { t } = useTranslation();
  const photos = getPhotos();

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
