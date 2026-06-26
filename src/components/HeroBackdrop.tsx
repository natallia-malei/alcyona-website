import type { ReactNode } from "react";

interface HeroBackdropProps {
  coverUrl: string;
  children: ReactNode;
}

export function HeroBackdrop({ coverUrl, children }: HeroBackdropProps) {
  return (
    <section
      id="new-album"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 blur-sm opacity-40"
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      {children}
    </section>
  );
}
