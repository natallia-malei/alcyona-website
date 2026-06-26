import type { ReactNode } from "react";

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
      className="text-sm uppercase tracking-widest hover:text-accent transition-colors"
    >
      {children}
    </a>
  );
}
