import { useTranslation } from "react-i18next";
import { usePhotos } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { SectionHeader } from "../components/ui/SectionHeader";
import { MediaFrame } from "../components/ui/MediaFrame";
import { MediaImage } from "../components/ui/MediaImage";
import { Filigree } from "../components/fx/Filigree";
import { grids } from "../styles/layouts";

export function Photos() {
  const { t } = useTranslation();
  const photos = usePhotos();
  const visible = photos.slice(0, 4);

  return (
    <section id="photos" className="py-24">
      <Container>
        <SectionHeader
          eyebrow={t("photos.eyebrow")}
          title={t("photos.title")}
          to="/photos"
          linkLabel={t("photos.all")}
        />
        <div className={grids.photos}>
          {visible.map((p) => (
            <div key={p.id} className="reveal group relative">
              <MediaFrame>
                <MediaImage src={p.url} alt="" zoom="group-hover" />
              </MediaFrame>
              <Filigree inset={10} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
