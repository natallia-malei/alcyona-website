import { useState } from "react";

type Size = "sm" | "md";

interface AvatarProps {
  imageUrl: string | null;
  initials: string;
  size?: Size;
}

const sizeClass: Record<Size, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
};

// Photo (Google) or initials in a circle; falls back to initials if the photo fails
export function Avatar({ imageUrl, initials, size = "sm" }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl !== null && imageUrl !== failedUrl;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-accent font-semibold text-white ${sizeClass[size]}`}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
