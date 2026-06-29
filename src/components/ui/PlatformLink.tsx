import type { ReactNode } from "react";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

type Variant = "text" | "icon";

interface PlatformLinkProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  ariaLabel?: string;
}

const variantClass: Record<Variant, string> = {
  text: `${typography.eyebrow} ${interactive.accentHover}`,
  icon: interactive.accentHover,
};

export function PlatformLink({
  href,
  children,
  variant = "text",
  ariaLabel,
}: PlatformLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={variantClass[variant]}
    >
      {children}
    </a>
  );
}
