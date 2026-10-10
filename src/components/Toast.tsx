import { useCallback, useState, type ReactNode } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import {
  ToastContext,
  type PushToast,
  type ToastAction,
  type ToastTone,
} from "../hooks/useToast";

interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  action?: ToastAction;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const push = useCallback<PushToast>(
    (text, tone = "ok", action) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text, tone, action }]);
      setTimeout(() => dismiss(id), action ? 8000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 font-semibold text-white shadow-lg"
          >
            {t.tone === "ok" ? (
              <CircleCheck size={20} />
            ) : (
              <TriangleAlert size={20} />
            )}
            {t.text}
            {t.action && (
              <button
                type="button"
                className="ml-2 min-h-10 rounded-lg px-3 font-bold text-accent-500 underline"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
