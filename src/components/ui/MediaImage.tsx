type Zoom = "hover" | "group-hover";

interface MediaImageProps {
  src: string;
  alt: string;
  zoom?: Zoom;
  className?: string;
}

const zoomClass: Record<Zoom, string> = {
  hover: "hover:scale-105",
  "group-hover": "group-hover:scale-105",
};

export function MediaImage({ src, alt, zoom, className = "" }: MediaImageProps) {
  const zoomCls = zoom ? `${zoomClass[zoom]} transition-transform duration-500` : "";
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${zoomCls} ${className}`}
    />
  );
}
