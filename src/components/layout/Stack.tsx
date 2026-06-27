import type { ReactNode } from "react";

type Gap = "sm" | "md" | "lg" | "xl";

interface StackProps {
  gap?: Gap;
  className?: string;
  children: ReactNode;
}

const gapClass: Record<Gap, string> = {
  sm: "space-y-2",
  md: "space-y-4",
  lg: "space-y-8",
  xl: "space-y-12",
};

export function Stack({ gap = "md", className = "", children }: StackProps) {
  return <div className={`${gapClass[gap]} ${className}`}>{children}</div>;
}
