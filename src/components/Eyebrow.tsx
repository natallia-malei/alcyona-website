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
  sm: "text-sm",
  xs: "text-xs",
};

const trackingClass: Record<Tracking, string> = {
  wide: "tracking-widest",
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
    <Tag className={`uppercase ${sizeClass[size]} ${trackingClass[tracking]} ${className}`}>
      {children}
    </Tag>
  );
}
