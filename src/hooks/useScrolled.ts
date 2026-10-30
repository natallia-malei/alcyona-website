import { useEffect, useState } from "react";

/** true, когда страница прокручена дальше порога — например, чтобы уплотнить шапку. */
export function useScrolled(threshold = 40): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
