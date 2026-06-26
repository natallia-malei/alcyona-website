import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";
import { Page } from "../components/Page";

export function Privacy() {
  const { t } = useTranslation();
  return (
    <Page size="sm">
      <PageTitle className="mb-8">{t("privacy.title")}</PageTitle>
      <div className="leading-relaxed space-y-4">
        <p>
          Сайт ALCYONA не собирает персональные данные посетителей за исключением
          информации, добровольно предоставляемой через формы обратной связи.
        </p>
        <p>
          Используются только технические cookies, необходимые для работы сайта.
          Аналитические системы и трекеры не подключены.
        </p>
        <p>
          По вопросам обработки персональных данных пишите на{" "}
          <a href="mailto:alcyona@gmail.com" className="underline hover:text-white">
            alcyona@gmail.com
          </a>
          .
        </p>
      </div>
    </Page>
  );
}
