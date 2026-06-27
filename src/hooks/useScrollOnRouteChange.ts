import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function useScrollOnRouteChange() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    if (hash) {
      const timer = setTimeout(() => {
        const id = hash.slice(1);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => clearTimeout(timer);
    }

    window.scrollTo({ top: 0 });
  }, [pathname, hash, navigationType]);
}
