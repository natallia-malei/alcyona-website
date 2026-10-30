import type { ReactNode } from "react";

type Size = "sm" | "xs";
type Tracking = "wide" | "extra";

interface EyebrowProps {
  size?: Size;
  tracking?: Tracking;
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: "text-xs",
  xs: "text-[11px]",
};

const trackingClass: Record<Tracking, string> = {
  wide: "tracking-[0.18em]",
  extra: "tracking-[0.3em]",
};

export function Eyebrow({
  size = "sm",
  tracking = "wide",
  as: Tag = "p",
  className = "",
  children,
}: EyebrowProps) {
  return (
    <Tag
      className={`font-mono uppercase ${sizeClass[size]} ${trackingClass[tracking]} ${className}`}
    >
      {children}
    </Tag>
  );
}
