import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getReleases, resetAll, saveReleases } from "../storage";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Page } from "../components/layout/Page";
import { SectionTitle } from "../components/ui/SectionTitle";
import { AdminReleaseRow } from "../components/admin/AdminReleaseRow";
import { DividerList } from "../components/ui/DividerList";

export function Admin() {
  const { t } = useTranslation();
  const [releases, setReleases] = useState(getReleases());

  const handleReset = () => {
    if (!confirm("Сбросить все данные к стартовым?")) return;
    resetAll();
    setReleases(getReleases());
  };

  const handleDelete = (id: string) => {
    const next = releases.filter((r) => r.id !== id);
    saveReleases(next);
    setReleases(next);
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
