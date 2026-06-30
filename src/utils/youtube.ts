export interface YouTubeMeta {
  videoId: string;
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
}

const YOUTUBE_ID_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

export async function fetchYouTubeMeta(url: string): Promise<YouTubeMeta> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`;

  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error(`YouTube returned ${res.status}`);
  }

  const data = (await res.json()) as OEmbedResponse;
  return {
    videoId,
    title: data.title ?? "",
    authorName: data.author_name,
    thumbnailUrl: data.thumbnail_url,
  };
}
