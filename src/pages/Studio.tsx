import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";
import { Page } from "../components/Page";
import { Lead } from "../components/Lead";

export function Studio() {
  const { t } = useTranslation();
  return (
    <Page>
      <PageTitle className="mb-8">{t("studio.title")}</PageTitle>
      <Lead>{t("studio.content")}</Lead>
    </Page>
  );
}
