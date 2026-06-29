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
import { usePhotos, useStorageActions } from "../storage/hooks";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { AddPhotoForm } from "../components/forms/AddPhotoForm";
import { SortablePhoto } from "../components/admin/SortablePhoto";
import { grids } from "../styles/layouts";

export function PhotosGallery() {
  const { t } = useTranslation();
  const photos = usePhotos();
  const { addPhoto, deletePhoto, reorderPhotos } = useStorageActions();
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAdd = async (url: string) => {
    await addPhoto(url);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("photos.deleteConfirm"))) return;
    try {
      await deletePhoto(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(photos, oldIndex, newIndex);
    try {
      await reorderPhotos(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reorder failed");
    }
  };

  return (
    <Page size="xl">
      <Stack gap="lg">
        <PageHeader
          title={t("photos.title")}
          actions={
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              + {t("photos.addPhoto")}
            </Button>
          }
        />

        {photos.length === 0 ? (
          <p>{t("photos.empty")}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className={grids.photos}>
                {photos.map((p) => (
                  <SortablePhoto
                    key={p.id}
                    photo={p}
                    onDelete={handleDelete}
                    deleteLabel={t("photos.deleteConfirm")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Stack>

      <Modal open={adding} onClose={() => setAdding(false)} title={t("photos.addPhoto")}>
        <AddPhotoForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
      </Modal>
    </Page>
  );
}
