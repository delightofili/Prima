import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "../i18n";

interface Props {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  top?: boolean; // a dialog opened on top of another dialog
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// Can the person actually reach it? Not if it, or something around it, is hidden or sits in a closed <details>.
function reachable(el: HTMLElement, root: HTMLElement): boolean {
  for (let n: HTMLElement | null = el; n && n !== root; n = n.parentElement) {
    if (n.hidden) return false;
    const s = getComputedStyle(n);
    if (s.display === "none" || s.visibility === "hidden") return false;
    if (
      n.tagName === "DETAILS" &&
      !(n as HTMLDetailsElement).open &&
      el.closest("summary")?.parentElement !== n
    )
      return false;
  }
  return true;
}

export function Modal({
  title,
  children,
  onClose,
  dismissible = true,
  top = false,
}: Props) {
  const { t } = useI18n();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dismissible || !onClose) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  // Opening: remember where the person was and move into the dialog. Closing: put them back there.
  useEffect(() => {
    const before =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const first = panel.current
      ? [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].find((el) =>
          reachable(el, panel.current!),
        )
      : undefined;
    (first ?? panel.current)?.focus();
    return () => {
      if (before && document.contains(before)) before.focus();
    };
  }, []);

  // Tab and Shift+Tab go round inside the dialog, so a keyboard or screen reader user cannot wander into the page behind it
  const keepFocusInside = (e: KeyboardEvent<HTMLDivElement>) => {
    const box = panel.current;
    if (e.key !== "Tab" || !box) return;
    if (!(e.target instanceof Node) || !box.contains(e.target)) return; // a dialog opened on top of this one looks after its own Tab
    const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => reachable(el, box),
    );
    if (items.length === 0) {
      e.preventDefault();
      box.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === box)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      // Every dialog sat at z-80 before (the old code read the browser's own "top" by mistake). That is kept, and a dialog
      // that is asked to be on top now really is above the others.
      className={`fixed inset-0 ${top ? "z-[90]" : "z-[80]"} flex items-end justify-center bg-ink/40 p-4 md:items-center`}
      onClick={dismissible ? onClose : undefined}
      onKeyDown={keepFocusInside}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="card max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          {dismissible && onClose && (
            <button
              type="button"
              aria-label={t("common.close")}
              className="p-2"
              onClick={onClose}
            >
              <X size={20} aria-hidden />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
