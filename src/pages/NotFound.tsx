import { useTranslation } from "react-i18next";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageTitle } from "../components/ui/PageTitle";
import { NavLink } from "../components/ui/NavLink";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <Page size="sm">
      <Stack gap="lg">
        <PageTitle>{t("notFound.title")}</PageTitle>
        <NavLink to="/" underline>
          ← {t("notFound.home")}
        </NavLink>
      </Stack>
    </Page>
  );
}
