import { useCallback, useState, type ReactNode } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import {
  ToastContext,
  type PushToast,
  type ToastTone,
} from "../hooks/useToast";

interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback<PushToast>((text, tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

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
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
