import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className={`${typography.eyebrow} ${interactive.mutedHover}`}>
      ← {children}
    </Link>
  );
}
