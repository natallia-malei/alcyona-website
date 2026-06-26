import { MediaFrame } from "./MediaFrame";

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
}

export function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  return (
    <MediaFrame aspect="video" tone="black">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </MediaFrame>
  );
}
