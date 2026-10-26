import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext, type ToastType, type ToastContextValue } from "./ToastContext";
import { CloseIcon } from "../icons/CloseIcon";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const DISMISS_MS = 4000;

const typeClass: Record<ToastType, string> = {
  success: "border-emerald-500/60 bg-emerald-950/80 text-emerald-100",
  error: "border-red-500/60 bg-red-950/80 text-red-100",
  info: "border-white/20 bg-bg-elevated text-white",
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-20 right-4 z-[80] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] md:w-auto pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`flex items-start gap-3 px-4 py-3 border rounded-sm shadow-lg pointer-events-auto ${typeClass[t.type]}`}
          >
            <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
