import type { ReactNode } from "react";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface PlatformLinkProps {
  href: string;
  children: ReactNode;
}

export function PlatformLink({ href, children }: PlatformLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${typography.eyebrow} ${interactive.accentHover}`}
    >
      {children}
    </a>
  );
}
