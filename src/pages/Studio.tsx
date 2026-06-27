import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/ui/PageTitle";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { Lead } from "../components/ui/Lead";

export function Studio() {
  const { t } = useTranslation();
  return (
    <Page>
      <Stack gap="lg">
        <PageTitle>{t("studio.title")}</PageTitle>
        <Lead>{t("studio.content")}</Lead>
      </Stack>
    </Page>
  );
}
