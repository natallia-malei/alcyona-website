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
import { useIsAdmin } from "../auth/hooks";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../hooks/useToast";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { MediaFrame } from "../components/ui/MediaFrame";
import { MediaImage } from "../components/ui/MediaImage";
import { AddPhotoForm } from "../components/forms/AddPhotoForm";
import { SortablePhoto } from "../components/photos/SortablePhoto";
import { grids } from "../styles/layouts";

export function PhotosGallery() {
  const { t } = useTranslation();
  const photos = usePhotos();
  const { addPhoto, deletePhoto, reorderPhotos } = useStorageActions();
  const isAdmin = useIsAdmin();
  const confirm = useConfirm();
  const toast = useToast();
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
    const ok = await confirm({ message: t("photos.deleteConfirm"), variant: "danger" });
    if (!ok) return;
    try {
      await deletePhoto(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.deleteFailed"));
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
      toast.error(e instanceof Error ? e.message : t("common.reorderFailed"));
    }
  };

  return (
    <Page size="xl">
      <Stack gap="lg">
        <PageHeader
          title={t("photos.title")}
          actions={
            isAdmin ? (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                + {t("photos.addPhoto")}
              </Button>
            ) : undefined
          }
        />

        {photos.length === 0 ? (
          <p>{t("photos.empty")}</p>
        ) : isAdmin ? (
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
        ) : (
          <div className={grids.photos}>
            {photos.map((p) => (
              <MediaFrame key={p.id}>
                <MediaImage src={p.url} alt="" zoom="hover" />
              </MediaFrame>
            ))}
          </div>
        )}
      </Stack>

      <Modal open={adding} onClose={() => setAdding(false)} title={t("photos.addPhoto")}>
        <AddPhotoForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
      </Modal>
    </Page>
  );
}
