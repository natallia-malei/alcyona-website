import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getReleases, resetAll, saveReleases } from "../storage";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/PageTitle";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
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
    <Container size="lg" className="pt-32 pb-20 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <PageTitle>{t("admin.title")}</PageTitle>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <p className="text-[--color-fg-muted] mb-4">
        Данные хранятся в Local Storage этого браузера. Полноценные формы
        редактирования будут добавлены на следующем этапе.
      </p>

      <SectionTitle size="sm" className="mt-10 mb-4">Релизы ({releases.length})</SectionTitle>
      <ul className="divide-y divide-white/10">
        {releases.map((r) => (
          <li key={r.id} className="py-3 flex items-center justify-between">
            <span>
              {tr(r.title)}{" "}
              <span className="text-[--color-fg-muted] text-sm">
                · {r.type} · {r.releaseDate}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="text-sm text-[--color-fg-muted] hover:text-[--color-accent]"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Container>
  );
}
