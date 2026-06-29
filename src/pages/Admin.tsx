import { useTranslation } from "react-i18next";
import { useReleases, useStorageActions } from "../storage/hooks";
import { PageHeader } from "../components/layout/PageHeader";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { SectionTitle } from "../components/ui/SectionTitle";
import { AdminReleaseRow } from "../components/admin/AdminReleaseRow";
import { DividerList } from "../components/ui/DividerList";

export function Admin() {
  const { t } = useTranslation();
  const releases = useReleases();
  const { deleteRelease } = useStorageActions();

  const handleDelete = async (id: string) => {
    if (!confirm(`Удалить релиз "${id}"?`)) return;
    try {
      await deleteRelease(id);
    } catch (e) {
      alert(`Не удалось удалить: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  };

  return (
    <Page size="lg">
      <Stack gap="md">
        <PageHeader title={t("admin.title")} />
        <p>{t("admin.note")}</p>
        <Stack gap="md" className="pt-6">
          <SectionTitle size="sm">Релизы ({releases.length})</SectionTitle>
          <DividerList>
            {releases.map((r) => (
              <AdminReleaseRow key={r.id} release={r} onDelete={handleDelete} />
            ))}
          </DividerList>
        </Stack>
      </Stack>
    </Page>
  );
}
