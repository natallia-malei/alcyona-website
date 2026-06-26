import type { ReactNode } from "react";
import { typography } from "../../styles/typography";

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
      className={`${typography.eyebrow} hover:text-accent transition-colors`}
    >
      {children}
    </a>
  );
}
