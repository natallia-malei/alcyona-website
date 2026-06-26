import type { PropsWithChildren } from "react";

type Size = "default" | "sm";

interface SectionTitleProps {
  size?: Size;
  className?: string;
}

const sizeClass: Record<Size, string> = {
  default: "text-3xl md:text-5xl",
  sm: "text-2xl",
};

export function SectionTitle({
  size = "default",
  className = "",
  children,
}: PropsWithChildren<SectionTitleProps>) {
  return (
    <h2 className={`font-bold tracking-tight ${sizeClass[size]} ${className}`}>
      {children}
    </h2>
  );
}
