import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getReleaseById } from "../storage";
import { Page } from "../components/Page";
import { ReleaseDetail } from "../sections/ReleaseDetail";

export function ReleasePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const release = id ? getReleaseById(id) : undefined;

  if (!release) {
    return (
      <Page size="xl">
        <p>Release not found.</p>
        <Link to="/" className="underline">← Home</Link>
      </Page>
    );
  }

  return (
    <Page size="xl">
      <Link
        to="/#releases"
        className="text-sm uppercase tracking-widest text-fg-muted hover:text-white"
      >
        ← {t("release.back")}
      </Link>
      <ReleaseDetail release={release} />
    </Page>
  );
}
