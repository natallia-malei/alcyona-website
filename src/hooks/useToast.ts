import { useContext, useMemo } from "react";
import { ToastContext } from "../components/ui/ToastContext";

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");

  return useMemo(
    () => ({
      success: (message: string) => ctx.show(message, "success"),
      error: (message: string) => ctx.show(message, "error"),
      info: (message: string) => ctx.show(message, "info"),
    }),
    [ctx],
  );
}
