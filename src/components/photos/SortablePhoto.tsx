import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Photo } from "../../types";
import { MediaFrame } from "../ui/MediaFrame";
import { MediaImage } from "../ui/MediaImage";
import { CloseIcon } from "../icons/CloseIcon";

interface SortablePhotoProps {
  photo: Photo;
  onDelete: (id: string) => void;
  deleteLabel: string;
}

export function SortablePhoto({ photo, onDelete, deleteLabel }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <MediaFrame>
          <MediaImage src={photo.url} alt="" />
        </MediaFrame>
      </div>
      <button
        type="button"
        onClick={() => onDelete(photo.id)}
        aria-label={deleteLabel}
        className="absolute top-2 right-2 p-1.5 rounded-sm bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
