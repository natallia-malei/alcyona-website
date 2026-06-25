import type { PropsWithChildren } from "react";

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
    <section
      id={id}
      className={`py-20 px-6 md:px-12 max-w-7xl mx-auto ${className}`}
    >
      {title && (
        <h2 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
