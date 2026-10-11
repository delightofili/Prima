import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export function UpgradeDialog({
  title,
  text,
  onClose,
}: {
  title: string;
  text: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-accent-50 p-2">
            <Lock size={22} />
          </span>
          <div>
            <h2 id="upgrade-title" className="text-lg font-bold">
              {title}
            </h2>
            <p className="mt-1 text-subtext">{text}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            className="btn btn-secondary md:w-36"
            onClick={onClose}
          >
            Not now
          </button>
          <Link
            to="/plans"
            className="btn btn-accent md:w-48"
            onClick={onClose}
          >
            See plans
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
