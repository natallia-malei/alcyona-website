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
import type { LocalizedText } from "../types";
import { useBand, useStorageActions, useVideos } from "../storage/hooks";
import { useIsAuthenticated } from "../auth/hooks";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Eyebrow } from "../components/ui/Eyebrow";
import { VideoEmbed } from "../components/ui/VideoEmbed";
import { AddVideoForm } from "../components/forms/AddVideoForm";
import { SortableVideo } from "../components/videos/SortableVideo";
import { grids } from "../styles/layouts";

export function VideosGallery() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const videos = useVideos();
  const band = useBand();
  const { addVideo, deleteVideo, reorderVideos } = useStorageActions();
  const isAuth = useIsAuthenticated();
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAdd = async (youtubeId: string, title: LocalizedText) => {
    await addVideo(youtubeId, title);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("videos.deleteConfirm"))) return;
    try {
      await deleteVideo(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(videos, oldIndex, newIndex);
    try {
      await reorderVideos(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reorder failed");
    }
  };

  const channelUrl = band.social.youtube;

  return (
    <Page size="xl">
      <Stack gap="lg">
        <PageHeader
          title={t("videos.title")}
          actions={
            <div className="flex flex-wrap gap-2">
              {channelUrl && (
                <Button variant="outline" size="sm" href={channelUrl}>
                  {t("videos.youtubeChannel")}
                </Button>
              )}
              {isAuth && (
                <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                  + {t("videos.addVideo")}
                </Button>
              )}
            </div>
          }
        />

        {videos.length === 0 ? (
          <p>{t("videos.empty")}</p>
        ) : isAuth ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map((v) => v.id)} strategy={rectSortingStrategy}>
              <div className={grids.videos}>
                {videos.map((v) => (
                  <SortableVideo
                    key={v.id}
                    video={v}
                    onDelete={handleDelete}
                    deleteLabel={t("videos.deleteConfirm")}
                    dragLabel={t("videos.dragHandle")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={grids.videos}>
            {videos.map((v) => (
              <Stack key={v.id} gap="sm">
                <VideoEmbed youtubeId={v.youtubeId} title={tr(v.title)} />
                <Eyebrow className="text-fg-muted">{tr(v.title)}</Eyebrow>
              </Stack>
            ))}
          </div>
        )}
      </Stack>

      <Modal open={adding} onClose={() => setAdding(false)} title={t("videos.addVideo")}>
        <AddVideoForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
      </Modal>
    </Page>
  );
}
