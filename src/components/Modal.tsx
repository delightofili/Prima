import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}

export function Modal({ title, children, onClose, dismissible = true }: Props) {
  useEffect(() => {
    if (!dismissible || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        className="card max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          {dismissible && onClose && (
            <button
              type="button"
              aria-label="Close"
              className="p-2"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
