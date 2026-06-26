import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getReleases, resetAll, saveReleases } from "../storage";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Page } from "../components/Page";
import { SectionTitle } from "../components/SectionTitle";

export function Admin() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
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

      <p className="mb-4">
        Данные хранятся в Local Storage этого браузера. Полноценные формы
        редактирования будут добавлены на следующем этапе.
      </p>

      <SectionTitle size="sm" className="mt-10 mb-4">Релизы ({releases.length})</SectionTitle>
      <ul className="divide-y divide-white/10">
        {releases.map((r) => (
          <li key={r.id} className="py-3 flex items-center justify-between">
            <span>
              {tr(r.title)}{" "}
              <span className="text-fg-muted text-sm">
                · {r.type} · {r.releaseDate}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="text-sm text-fg-muted hover:text-accent"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
}
