import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";
import { Page } from "../components/Page";

export function Studio() {
  const { t } = useTranslation();
  return (
    <Page>
      <PageTitle className="mb-8">{t("studio.title")}</PageTitle>
      <p className="text-lg leading-relaxed">
        {/* TODO: контент студии — описание, оборудование, фото, услуги */}
        Здесь будет описание студии группы ALCYONA: оборудование, услуги записи,
        фотографии помещения, контакты.
      </p>
    </Page>
  );
}
