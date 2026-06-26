import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { typography } from "../../styles/typography";

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link
      to={to}
      className={`${typography.eyebrow} text-fg-muted hover:text-white transition-colors`}
    >
      ← {children}
    </Link>
  );
}
