import type { ReactNode } from "react";
import { Container } from "./Container";
import { SectionTitle } from "../ui/SectionTitle";
import { Eyebrow } from "../ui/Eyebrow";

interface CTASectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Декор за содержимым — например, созвездие */
  decor?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function CTASection({
  id,
  eyebrow,
  title,
  subtitle,
  action,
  decor,
  className = "",
  children,
}: CTASectionProps) {
  return (
    <section
      id={id}
      className={`relative isolate overflow-clip border-y border-line/60 bg-[radial-gradient(60%_100%_at_50%_0%,#161b2e_0%,var(--color-bg)_75%)] py-24 md:py-28 ${className}`}
    >
      {decor}
      {action && <div className="absolute top-4 right-4 md:right-8 z-10">{action}</div>}
      <Container size="md" className="reveal relative text-center">
        {eyebrow && <Eyebrow className="mb-4 text-accent">{eyebrow}</Eyebrow>}
        <SectionTitle ornament="center" className="mb-5">
          {title}
        </SectionTitle>
        {subtitle && (
          <p className="mx-auto mb-8 max-w-[34ch] text-lg [text-wrap:balance]">{subtitle}</p>
        )}
        {children}
      </Container>
    </section>
  );
}
