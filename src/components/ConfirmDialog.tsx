import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-danger/10 p-2 text-danger">
            <TriangleAlert size={22} />
          </span>
          <div>
            <h2 id="confirm-title" className="text-lg font-bold">
              {title}
            </h2>
            <p className="mt-1 text-subtext">{message}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            autoFocus
            className="btn btn-secondary md:w-36"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn bg-danger text-white hover:brightness-90 md:w-48"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
