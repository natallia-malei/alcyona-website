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
  icon: "grid size-11 place-items-center [&_svg]:size-5 rounded-full border border-fg/15 text-fg/85 transition-[color,border-color,box-shadow] duration-300 hover:border-accent hover:text-accent-hi hover:shadow-[0_0_18px_rgba(236,208,147,.3)]",
};

export function PlatformLink({ href, children, variant = "text", ariaLabel }: PlatformLinkProps) {
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
