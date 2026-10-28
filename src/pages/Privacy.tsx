import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/ui/PageTitle";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { NavLink } from "../components/ui/NavLink";

interface PrivacySection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

export function Privacy() {
  const { t } = useTranslation();
  const sections = t("privacy.sections", { returnObjects: true }) as PrivacySection[];

  return (
    <Page size="sm">
      <Stack gap="lg">
        <PageTitle>{t("privacy.title")}</PageTitle>
        <Stack gap="md" className="leading-relaxed">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.items && (
                <ul className="list-disc pl-5 space-y-1 text-fg-muted">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
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
