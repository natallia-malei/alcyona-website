import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg" | "xl";

interface ContainerProps {
  size?: Size;
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

export function Container({
  size = "xl",
  className = "",
  children,
}: ContainerProps) {
  return (
    <div className={`${sizeClass[size]} mx-auto px-6 md:px-12 ${className}`}>
      {children}
    </div>
  );
}
