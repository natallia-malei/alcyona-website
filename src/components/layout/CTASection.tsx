import type { ReactNode } from "react";
import { Container } from "./Container";
import { SectionTitle } from "../ui/SectionTitle";

interface CTASectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function CTASection({
  id,
  title,
  subtitle,
  action,
  className = "",
  children,
}: CTASectionProps) {
  return (
    <section id={id} className={`relative py-16 bg-bg-elevated ${className}`}>
      {action && <div className="absolute top-4 right-4 md:right-8 z-10">{action}</div>}
      <Container size="md" className="text-center">
        <SectionTitle className="mb-3">{title}</SectionTitle>
        {subtitle && <p className="mb-6">{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}
