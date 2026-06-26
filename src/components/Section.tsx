import type { PropsWithChildren } from "react";
import { Container } from "./Container";
import { SectionTitle } from "./SectionTitle";

interface SectionProps {
  id?: string;
  title?: string;
  className?: string;
}

export function Section({
  id,
  title,
  className = "",
  children,
}: PropsWithChildren<SectionProps>) {
  return (
    <section id={id} className={`py-20 ${className}`}>
      <Container>
        {title && <SectionTitle className="mb-10">{title}</SectionTitle>}
        {children}
      </Container>
    </section>
  );
}
