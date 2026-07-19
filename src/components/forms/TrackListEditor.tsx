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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Track } from "../../types";
import { TrackRow } from "./TrackRow";
import { typography } from "../../styles/typography";

interface TrackListEditorProps {
  tracks: Track[];
  onChange: (tracks: Track[]) => void;
}

function makeEmptyTrack(): Track {
  return {
    id: crypto.randomUUID(),
    title: { ru: "", en: "" },
    durationSec: 0,
    lyrics: { ru: "", en: "" },
  };
}

export function TrackListEditor({ tracks, onChange }: TrackListEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAdd = () => onChange([...tracks, makeEmptyTrack()]);

  const handleTrackChange = (updated: Track) =>
    onChange(tracks.map((t) => (t.id === updated.id ? updated : t)));

  const handleDelete = (id: string) => onChange(tracks.filter((t) => t.id !== id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tracks.findIndex((t) => t.id === active.id);
    const newIndex = tracks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(tracks, oldIndex, newIndex));
  };

  return (
    <div>
      <div className={`mb-3 ${typography.caption}`}>Tracks ({tracks.length})</div>

      {tracks.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  onChange={handleTrackChange}
                  onDelete={() => handleDelete(track.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-3 w-full py-2 border border-dashed border-white/20 rounded-sm text-sm text-fg-muted hover:text-white hover:border-white/40 transition-colors"
      >
        + Add track
      </button>
    </div>
  );
}
