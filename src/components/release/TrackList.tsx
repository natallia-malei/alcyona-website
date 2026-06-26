import type { Track } from "../../types";
import { TrackItem } from "./TrackItem";
import { DividerList } from "../ui/DividerList";

interface TrackListProps {
  tracks: Track[];
}

export function TrackList({ tracks }: TrackListProps) {
  return (
    <DividerList as="ol">
      {tracks.map((track, idx) => (
        <TrackItem key={track.id} track={track} index={idx} />
      ))}
    </DividerList>
  );
}
