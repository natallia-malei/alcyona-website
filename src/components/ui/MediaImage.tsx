type Zoom = "hover" | "group-hover";

interface MediaImageProps {
  src: string;
  alt: string;
  zoom?: Zoom;
  className?: string;
  /** Общее имя для View Transition между страницами */
  transitionName?: string;
}

const zoomClass: Record<Zoom, string> = {
  hover: "hover:scale-105",
  "group-hover": "group-hover:scale-105",
};

export function MediaImage({ src, alt, zoom, className = "", transitionName }: MediaImageProps) {
  const zoomCls = zoom
    ? `${zoomClass[zoom]} transition-transform duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]`
    : "";
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      className={`w-full h-full object-cover ${zoomCls} ${className}`}
    />
  );
}
