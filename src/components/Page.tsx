import type { ReactNode } from "react";
import { Container } from "./Container";

type Size = "sm" | "md" | "lg" | "xl";

interface PageProps {
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Page({ size = "md", className = "", children }: PageProps) {
  return (
    <Container size={size} className={`pt-32 pb-20 min-h-screen ${className}`}>
      {children}
    </Container>
  );
}
