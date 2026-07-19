import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import type { Release } from "../../types";
import { useLocalizedText } from "../../hooks/useLocalizedText";
import { Stack } from "../layout/Stack";
import { Eyebrow } from "../ui/Eyebrow";
import { MediaFrame } from "../ui/MediaFrame";
import { MediaImage } from "../ui/MediaImage";
import { EditIcon } from "../icons/EditIcon";
import { CloseIcon } from "../icons/CloseIcon";
import { GripIcon } from "../icons/GripIcon";
import { interactive } from "../../styles/interactive";

interface SortableReleaseCardProps {
  release: Release;
  onEdit: (release: Release) => void;
  onDelete: (id: string) => void;
  editLabel: string;
  deleteLabel: string;
  dragLabel: string;
}

export function SortableReleaseCard({
  release,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  dragLabel,
}: SortableReleaseCardProps) {
  const tr = useLocalizedText();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: release.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none">
      <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={dragLabel}
          className="p-1.5 rounded-sm bg-black/70 text-white hover:bg-accent cursor-grab active:cursor-grabbing"
        >
          <GripIcon />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(release)}
            aria-label={editLabel}
            className="p-1.5 rounded-sm bg-black/70 text-white hover:bg-accent transition-colors"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(release.id)}
            aria-label={deleteLabel}
            className="p-1.5 rounded-sm bg-black/70 text-white hover:bg-accent transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Link to={`/release/${release.id}`} className="block">
        <Stack gap="sm">
          <MediaFrame>
            <MediaImage src={release.coverUrl} alt={tr(release.title)} zoom="group-hover" />
          </MediaFrame>
          <Eyebrow size="xs" className="text-fg-muted">
            {release.type} · {new Date(release.releaseDate).getFullYear()}
          </Eyebrow>
          <h3 className={`text-lg font-semibold ${interactive.accentGroupHover}`}>
            {tr(release.title)}
          </h3>
        </Stack>
      </Link>
    </div>
  );
}
