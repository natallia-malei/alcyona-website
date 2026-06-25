import { useTranslation } from "react-i18next";
import { getPhotos } from "../storage";
import { Section } from "../components/Section";

export function Photos() {
  const { t } = useTranslation();
  const photos = getPhotos();

  return (
    <Section id="photos" title={t("photos.title")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <div
            key={p.id}
            className="aspect-square overflow-hidden bg-[--color-bg-elevated]"
          >
            <img
              src={p.url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
