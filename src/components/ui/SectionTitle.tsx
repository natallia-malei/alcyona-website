import type { PropsWithChildren } from "react";
import { typography } from "../../styles/typography";
import { Ornament } from "./Ornament";

type Size = "default" | "sm";

interface SectionTitleProps {
  size?: Size;
  /** Ромб-разделитель под заголовком; у маленьких заголовков его нет */
  ornament?: "start" | "center" | false;
  className?: string;
}

const sizeClass: Record<Size, string> = {
  default: "text-4xl md:text-6xl",
  sm: "text-2xl md:text-3xl",
};

export function SectionTitle({
  size = "default",
  ornament = size === "default" ? "start" : false,
  className = "",
  children,
}: PropsWithChildren<SectionTitleProps>) {
  return (
    <div className={className}>
      <h2 className={`${typography.heading} ${sizeClass[size]}`}>{children}</h2>
      {ornament && <Ornament align={ornament} className="mt-4" />}
    </div>
  );
}
