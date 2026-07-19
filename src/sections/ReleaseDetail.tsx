import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Release } from "../types";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { useStorageActions } from "../storage/hooks";
import { useIsAuthenticated } from "../auth/hooks";
import { PageTitle } from "../components/ui/PageTitle";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Eyebrow } from "../components/ui/Eyebrow";
import { ReleaseLinks } from "../components/release/ReleaseLinks";
import { TrackList } from "../components/release/TrackList";
import { ReleaseCover } from "../components/release/ReleaseCover";
import { EditButton } from "../components/ui/EditButton";
import { Modal } from "../components/ui/Modal";
import { ReleaseForm } from "../components/forms/ReleaseForm";
import { grids } from "../styles/layouts";

interface ReleaseDetailProps {
  release: Release;
}

export function ReleaseDetail({ release }: ReleaseDetailProps) {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const { upsertRelease } = useStorageActions();
  const isAuth = useIsAuthenticated();
  const [editing, setEditing] = useState(false);

  const handleSave = async (next: Release) => {
    await upsertRelease(next);
    setEditing(false);
  };

  return (
    <>
      {isAuth && (
        <div className="flex justify-end mt-8">
          <EditButton onClick={() => setEditing(true)} />
        </div>
      )}

      <div className={`${grids.releaseDetail} mt-4`}>
        <div>
          <ReleaseCover coverUrl={release.coverUrl} alt={tr(release.title)} />
          <ReleaseLinks links={release.links} className="mt-6" />
        </div>

        <div>
          <Eyebrow tracking="extra" className="text-accent mb-2">
            {release.type} · {new Date(release.releaseDate).getFullYear()}
          </Eyebrow>
          <PageTitle className="mb-6">{tr(release.title)}</PageTitle>
          <p className="mb-10">{tr(release.description)}</p>

          <SectionTitle size="sm" className="mb-4">
            {t("release.tracks")}
          </SectionTitle>
          <TrackList tracks={release.tracks} />
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit release">
        <ReleaseForm
          initialRelease={release}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
