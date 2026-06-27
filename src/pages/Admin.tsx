import { useTranslation } from "react-i18next";
import { useReleases, useStorageActions } from "../storage/hooks";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Page } from "../components/layout/Page";
import { SectionTitle } from "../components/ui/SectionTitle";
import { AdminReleaseRow } from "../components/admin/AdminReleaseRow";
import { DividerList } from "../components/ui/DividerList";

export function Admin() {
  const { t } = useTranslation();
  const releases = useReleases();
  const { saveReleases, resetAll } = useStorageActions();

  const handleReset = () => {
    if (!confirm("Сбросить все данные к стартовым?")) return;
    resetAll();
  };

  const handleDelete = (id: string) => {
    saveReleases(releases.filter((r) => r.id !== id));
  };

  return (
    <Page size="lg">
      <PageHeader
        title={t("admin.title")}
        actions={
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        }
        className="mb-8"
      />

      <p className="mb-4">{t("admin.note")}</p>

      <SectionTitle size="sm" className="mt-10 mb-4">Релизы ({releases.length})</SectionTitle>
      <DividerList>
        {releases.map((r) => (
          <AdminReleaseRow key={r.id} release={r} onDelete={handleDelete} />
        ))}
      </DividerList>
    </Page>
  );
}
