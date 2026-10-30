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
  disabled?: boolean;
  /** Мягкое «дыхание» свечением — только для главных призывов на публичных страницах */
  glow?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 uppercase tracking-[0.16em] font-semibold transition-colors";

const variantClass: Record<Variant, string> = {
  primary: "btn-gold",
  telegram: "btn-gold",
  outline: "border border-accent/70 text-fg hover:border-accent-hi hover:text-accent-hi",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-7 py-3.5 text-[13px]",
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
  disabled = false,
  glow = false,
}: ButtonProps) {
  const cls = `${base} ${variantClass[variant]} ${sizeClass[size]} ${glow ? "btn-glow" : ""} ${
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
  } ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        aria-disabled={disabled}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
