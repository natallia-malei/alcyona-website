import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Release } from "../types";
import { useReleases, useStorageActions } from "../storage/hooks";
import { useIsAuthenticated } from "../auth/hooks";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ReleaseForm } from "../components/forms/ReleaseForm";
import { ReleaseCard } from "../components/release/ReleaseCard";
import { SortableReleaseCard } from "../components/release/SortableReleaseCard";
import { grids } from "../styles/layouts";

function makeEmptyRelease(): Release {
  return {
    id: crypto.randomUUID(),
    title: { ru: "", en: "" },
    type: "album",
    releaseDate: new Date().toISOString().split("T")[0],
    coverUrl: "",
    description: { ru: "", en: "" },
    tracks: [],
    links: {},
  };
}

export function ReleasesGallery() {
  const { t } = useTranslation();
  const releases = useReleases();
  const { upsertRelease, deleteRelease, reorderReleases } = useStorageActions();
  const isAuth = useIsAuthenticated();
  const [editing, setEditing] = useState<Release | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSave = async (release: Release) => {
    await upsertRelease(release);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("releases.deleteConfirm"))) return;
    try {
      await deleteRelease(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = releases.findIndex((r) => r.id === active.id);
    const newIndex = releases.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(releases, oldIndex, newIndex);
    try {
      await reorderReleases(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reorder failed");
    }
  };

  const isNew = editing !== null && !releases.some((r) => r.id === editing.id);

  return (
    <Page size="xl">
      <Stack gap="lg">
        <PageHeader
          title={t("releases.title")}
          actions={
            isAuth ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(makeEmptyRelease())}>
                + {t("releases.addRelease")}
              </Button>
            ) : undefined
          }
        />

        {releases.length === 0 ? (
          <p>{t("releases.empty")}</p>
        ) : isAuth ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={releases.map((r) => r.id)} strategy={rectSortingStrategy}>
              <div className={grids.releases}>
                {releases.map((release) => (
                  <SortableReleaseCard
                    key={release.id}
                    release={release}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                    editLabel={t("releases.editRelease")}
                    deleteLabel={t("releases.deleteConfirm")}
                    dragLabel={t("releases.dragHandle")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={grids.releases}>
            {releases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        )}
      </Stack>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? t("releases.addRelease") : t("releases.editRelease")}
      >
        {editing && (
          <ReleaseForm
            initialRelease={editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </Page>
  );
}
