import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Video } from "../../types";
import { VideoEmbed } from "../ui/VideoEmbed";
import { Eyebrow } from "../ui/Eyebrow";
import { CloseIcon } from "../icons/CloseIcon";
import { GripIcon } from "../icons/GripIcon";
import { useLocalizedText } from "../../hooks/useLocalizedText";

interface SortableVideoProps {
  video: Video;
  onDelete: (id: string) => void;
  deleteLabel: string;
  dragLabel: string;
}

export function SortableVideo({ video, onDelete, deleteLabel, dragLabel }: SortableVideoProps) {
  const tr = useLocalizedText();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(video.id);
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="flex items-center justify-between gap-2 px-2 py-2 bg-bg-elevated border border-white/10 rounded-t-sm">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={dragLabel}
          className="flex-1 flex items-center justify-center text-fg-muted hover:text-white cursor-grab active:cursor-grabbing transition-colors py-1"
        >
          <GripIcon />
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={deleteLabel}
          className="p-1 text-fg-muted hover:text-accent transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      <VideoEmbed youtubeId={video.youtubeId} title={tr(video.title)} />
      <Eyebrow className="mt-3 text-fg-muted">{tr(video.title)}</Eyebrow>
    </div>
  );
}
