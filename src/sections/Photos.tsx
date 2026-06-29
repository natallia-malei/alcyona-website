import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePhotos } from "../storage/hooks";
import { Container } from "../components/layout/Container";
import { SectionTitle } from "../components/ui/SectionTitle";
import { MediaFrame } from "../components/ui/MediaFrame";
import { MediaImage } from "../components/ui/MediaImage";
import { grids } from "../styles/layouts";
import { interactive } from "../styles/interactive";

export function Photos() {
  const { t } = useTranslation();
  const photos = usePhotos();
  const visible = photos.slice(0, 4);

  return (
    <section id="photos" className="py-20">
      <Container>
        <Link to="/photos" className={`inline-block mb-10 ${interactive.accentHover}`}>
          <SectionTitle>{t("photos.title")}</SectionTitle>
        </Link>
        <div className={grids.photos}>
          {visible.map((p) => (
            <MediaFrame key={p.id}>
              <MediaImage src={p.url} alt="" zoom="hover" />
            </MediaFrame>
          ))}
        </div>
      </Container>
    </section>
  );
}
