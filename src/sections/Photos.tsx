import { useTranslation } from "react-i18next";
import { getPhotos } from "../storage";
import { Section } from "../components/Section";
import { MediaFrame } from "../components/MediaFrame";
import { MediaImage } from "../components/MediaImage";

export function Photos() {
  const { t } = useTranslation();
  const photos = getPhotos();

  return (
    <Section id="photos" title={t("photos.title")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <MediaFrame key={p.id}>
            <MediaImage src={p.url} alt="" zoom="hover" />
          </MediaFrame>
        ))}
      </div>
    </Section>
  );
}
