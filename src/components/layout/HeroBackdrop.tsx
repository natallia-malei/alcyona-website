import type { ReactNode } from "react";
import { Starfield } from "../fx/Starfield";

interface HeroBackdropProps {
  children: ReactNode;
}

/** Первый экран: ночное небо с Плеядами, тёплое свечение снизу и туман. */
export function HeroBackdrop({ children }: HeroBackdropProps) {
  return (
    <section
      id="new-album"
      className="relative isolate flex min-h-[88svh] items-center overflow-hidden bg-[radial-gradient(90%_70%_at_60%_30%,#161c33_0%,#0e1120_45%,var(--color-bg)_80%)] pt-28 pb-16 md:pb-20"
    >
      <Starfield className="-z-10 cursor-crosshair" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_120%,rgba(181,64,47,.24),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="fog pointer-events-none absolute -inset-x-[10%] -bottom-12 -z-10 h-56"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-b from-transparent to-bg"
      />
      {children}
    </section>
  );
}
