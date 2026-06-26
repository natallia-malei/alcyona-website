import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";
import { Container } from "../components/Container";

export function Studio() {
  const { t } = useTranslation();
  return (
    <Container size="md" className="pt-32 pb-20 min-h-screen">
      <PageTitle className="mb-8">{t("studio.title")}</PageTitle>
      <p className="text-[--color-fg-muted] text-lg leading-relaxed">
        {/* TODO: контент студии — описание, оборудование, фото, услуги */}
        Здесь будет описание студии группы ALCYONA: оборудование, услуги записи,
        фотографии помещения, контакты.
      </p>
    </Container>
  );
}
