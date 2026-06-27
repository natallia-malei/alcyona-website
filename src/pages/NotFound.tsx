import { useTranslation } from "react-i18next";
import { Page } from "../components/layout/Page";
import { PageTitle } from "../components/ui/PageTitle";
import { NavLink } from "../components/ui/NavLink";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <Page size="sm">
      <PageTitle className="mb-8">{t("notFound.title")}</PageTitle>
      <NavLink to="/" underline>
        ← {t("notFound.home")}
      </NavLink>
    </Page>
  );
}
