import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";

export function Studio() {
  const { t } = useTranslation();
  return (
    <div className="pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto min-h-screen">
      <PageTitle className="mb-8">{t("studio.title")}</PageTitle>
      <p className="text-[--color-fg-muted] text-lg leading-relaxed">
        {/* TODO: контент студии — описание, оборудование, фото, услуги */}
        Здесь будет описание студии группы ALCYONA: оборудование, услуги записи,
        фотографии помещения, контакты.
      </p>
    </div>
  );
}
