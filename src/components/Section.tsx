import type { PropsWithChildren } from "react";
import { Container } from "./Container";

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
        {title && (
          <h2 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight">
            {title}
          </h2>
        )}
        {children}
      </Container>
    </section>
  );
}
