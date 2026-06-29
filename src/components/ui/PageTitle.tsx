import type { PropsWithChildren } from "react";
import { typography } from "../../styles/typography";

interface Props {
  size?: "default" | "hero";
  className?: string;
}

const sizeClass = {
  default: "text-4xl md:text-5xl",
  hero: "text-5xl md:text-7xl",
};

export function PageTitle({
  size = "default",
  className = "",
  children,
}: PropsWithChildren<Props>) {
  return <h1 className={`${typography.heading} ${sizeClass[size]} ${className}`}>{children}</h1>;
}
