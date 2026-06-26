import type { ReactNode } from "react";

type Aspect = "square" | "video";
type Tone = "elevated" | "black" | "none";

interface MediaFrameProps {
  aspect?: Aspect;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const aspectClass: Record<Aspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
};

const toneClass: Record<Tone, string> = {
  elevated: "bg-bg-elevated",
  black: "bg-black",
  none: "",
};

export function MediaFrame({
  aspect = "square",
  tone = "elevated",
  className = "",
  children,
}: MediaFrameProps) {
  return (
    <div className={`overflow-hidden ${aspectClass[aspect]} ${toneClass[tone]} ${className}`}>
      {children}
    </div>
  );
}
