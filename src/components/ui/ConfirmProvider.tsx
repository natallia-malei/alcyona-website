import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmContext, type ConfirmOptions, type ConfirmContextValue } from "./ConfirmContext";
import { Button } from "./Button";

interface PendingConfirm extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const confirm = useCallback((input: ConfirmOptions | string) => {
    const options: ConfirmOptions = typeof input === "string" ? { message: input } : input;
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    current.resolve(result);
    setPending(null);
  }, []);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80"
          onClick={() => settle(false)}
        >
          <div
            className="w-full max-w-sm bg-bg-elevated border border-white/10 rounded-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-white">{pending.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => settle(false)}>
                {pending.cancelLabel ?? t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => settle(true)}
                className={pending.variant === "danger" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {pending.confirmLabel ?? t("common.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
