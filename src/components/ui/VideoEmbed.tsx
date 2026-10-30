import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MediaFrame } from "./MediaFrame";

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
}

/**
 * Фасад вместо встроенного плеера: своя обложка и золотая ▶.
 * Плеер YouTube (youtube-nocookie) грузится только по клику — страница легче,
 * и блок не превращается в пустой квадрат, если посетитель отказался от cookie.
 */
export function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Кнопка исчезает — переводим фокус на плеер, чтобы клавиатура не терялась
  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  return (
    <MediaFrame aspect="video" tone="black" className="relative">
      {playing ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${t("release.playVideo")}: ${title}`}
          className="group relative block size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-hi"
        >
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-[transform,filter] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105 group-hover:brightness-75"
          />
          <span className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-bg/80" />
          <span className="play-ring absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent-hi bg-linear-to-b from-[#ddba70] to-[#a9843f] text-on-accent shadow-[0_8px_30px_rgba(0,0,0,.55)] transition-[scale,box-shadow] duration-500 group-hover:scale-110 group-hover:shadow-[0_0_44px_rgba(236,208,147,.45)]">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1 size-7">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          </span>
        </button>
      )}
    </MediaFrame>
  );
}
