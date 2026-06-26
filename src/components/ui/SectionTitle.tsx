import type { PropsWithChildren } from "react";
import { typography } from "../../styles/typography";

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
    <h2 className={`${typography.heading} ${sizeClass[size]} ${className}`}>
      {children}
    </h2>
  );
}
