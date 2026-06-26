import type { ReactNode } from "react";
import { Container } from "./Container";
import { SectionTitle } from "./SectionTitle";

interface CTASectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function CTASection({ id, title, subtitle, className = "", children }: CTASectionProps) {
  return (
    <section id={id} className={`py-16 bg-bg-elevated ${className}`}>
      <Container size="md" className="text-center">
        <SectionTitle className="mb-3">{title}</SectionTitle>
        {subtitle && <p className="mb-6">{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}
