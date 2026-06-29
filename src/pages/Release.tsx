import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useReleaseById } from "../storage/hooks";
import { Page } from "../components/layout/Page";
import { NavLink } from "../components/ui/NavLink";
import { BackLink } from "../components/ui/BackLink";
import { ReleaseDetail } from "../sections/ReleaseDetail";

export function ReleasePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const release = useReleaseById(id);

  if (!release) {
    return (
      <Page size="xl">
        <p>Release not found.</p>
        <NavLink to="/" underline>
          ← Home
        </NavLink>
      </Page>
    );
  }

  return (
    <Page size="xl">
      <BackLink to="/#releases">{t("release.back")}</BackLink>
      <ReleaseDetail release={release} />
    </Page>
  );
}
