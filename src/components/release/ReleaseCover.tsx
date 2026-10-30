import { usePointerTilt } from "../../hooks/usePointerTilt";

type Size = "md" | "lg";

interface ReleaseCoverProps {
  coverUrl: string;
  alt: string;
  size?: Size;
  /** Обложка-реликвия: наклон за курсором, блик и золотая рамка в глубине */
  tilt?: boolean;
  /** Общее имя для View Transition — обложка «перелетает» между страницами */
  transitionName?: string;
}

const sizeClass: Record<Size, string> = {
  md: "w-full",
  lg: "w-full max-w-md mx-auto",
};

export function ReleaseCover({
  coverUrl,
  alt,
  size = "md",
  tilt = false,
  transitionName,
}: ReleaseCoverProps) {
  const tiltHandlers = usePointerTilt();
  const img = (
    <img
      src={coverUrl}
      alt={alt}
      loading={size === "lg" ? "eager" : "lazy"}
      decoding="async"
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      className={`block aspect-square object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,.85)] ${sizeClass[size]}`}
    />
  );

  if (!tilt) return img;

  return (
    <div
      {...tiltHandlers}
      className={`relic shadow-[0_0_60px_rgba(236,208,147,.12)] ${sizeClass[size]}`}
    >
      {img}
    </div>
  );
}
