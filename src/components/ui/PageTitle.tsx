import type { PropsWithChildren } from "react";
import { typography } from "../../styles/typography";

interface Props {
  size?: "default" | "hero";
  className?: string;
}

const sizeClass = {
  default: "text-5xl md:text-6xl",
  hero: "text-6xl md:text-8xl leading-[0.95]",
};

export function PageTitle({
  size = "default",
  className = "",
  children,
}: PropsWithChildren<Props>) {
  return <h1 className={`${typography.heading} ${sizeClass[size]} ${className}`}>{children}</h1>;
}
