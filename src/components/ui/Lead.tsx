import type { ReactNode } from "react";

interface LeadProps {
  className?: string;
  children: ReactNode;
}

export function Lead({ className = "", children }: LeadProps) {
  return <p className={`text-lg leading-relaxed ${className}`}>{children}</p>;
}
