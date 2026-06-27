import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/ui/PageTitle";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { NavLink } from "../components/ui/NavLink";

export function Privacy() {
  const { t } = useTranslation();
  return (
    <Page size="sm">
      <Stack gap="lg">
        <PageTitle>{t("privacy.title")}</PageTitle>
        <Stack gap="md" className="leading-relaxed">
          <p>{t("privacy.paragraph1")}</p>
          <p>{t("privacy.paragraph2")}</p>
          <p>
            {t("privacy.contactPrefix")}
            <NavLink href="mailto:alcyona@gmail.com" underline>
              alcyona@gmail.com
            </NavLink>
            .
          </p>
        </Stack>
      </Stack>
    </Page>
  );
}
