import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "telegram" | "outline";
type Size = "sm" | "md";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

const base =
  "inline-flex items-center justify-center gap-2 uppercase tracking-widest font-semibold transition-colors";

const variantClass: Record<Variant, string> = {
  primary: "bg-accent hover:bg-red-700 text-white",
  telegram: "bg-[#229ED9] hover:bg-[#1a82b3] text-white",
  outline: "border border-white/20 text-white hover:bg-white/10",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-8 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  to,
  href,
  onClick,
  type = "button",
}: ButtonProps) {
  const cls = `${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
