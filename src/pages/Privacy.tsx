import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";

export function Privacy() {
  const { t } = useTranslation();
  return (
    <div className="pt-32 pb-20 px-6 md:px-12 max-w-3xl mx-auto min-h-screen">
      <PageTitle className="mb-8">{t("privacy.title")}</PageTitle>
      <div className="prose prose-invert text-[--color-fg-muted] leading-relaxed space-y-4">
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
    </div>
  );
}
