import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "default" | "accent";

interface NavLinkProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  to?: string;
  href?: string;
}

const variantClass: Record<Variant, string> = {
  default: "hover:text-white",
  accent: "hover:text-[--color-accent]",
};

function isExternal(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function NavLink({
  variant = "default",
  className = "",
  children,
  to,
  href,
}: NavLinkProps) {
  const cls = `transition-colors ${variantClass[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = isExternal(href);
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {children}
      </a>
    );
  }

  return null;
}
