import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/ui/PageTitle";
import { Page } from "../components/layout/Page";
import { NavLink } from "../components/ui/NavLink";

export function Privacy() {
  const { t } = useTranslation();
  return (
    <Page size="sm">
      <PageTitle className="mb-8">{t("privacy.title")}</PageTitle>
      <div className="leading-relaxed space-y-4">
        <p>{t("privacy.paragraph1")}</p>
        <p>{t("privacy.paragraph2")}</p>
        <p>
          {t("privacy.contactPrefix")}
          <NavLink href="mailto:alcyona@gmail.com" underline>
            alcyona@gmail.com
          </NavLink>
          .
        </p>
      </div>
    </Page>
  );
}
