import type { CSSProperties, ReactNode } from "react";
import { useKeyboardInset } from "../hooks/useKeyboardInset";

// The Save and Cancel buttons of a form, kept in view. On a phone they sit just above the bottom tabs
// (or just above the keyboard while typing). On a tablet or laptop they stick to the bottom of the screen.
export function StickyActions({
  children,
  note,
  className = "",
}: {
  children: ReactNode;
  note?: string;
  className?: string;
}) {
  const keyboard = useKeyboardInset();
  const style = {
    "--sticky-bottom":
      keyboard > 0
        ? `${keyboard}px`
        : "calc(var(--tabbar-h) + env(safe-area-inset-bottom))",
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`fixed inset-x-0 bottom-[var(--sticky-bottom)] z-20 flex items-center gap-3 border-t-2 border-line bg-white px-4 py-3 md:sticky md:inset-x-auto md:bottom-0 md:z-10 md:-mx-8 md:justify-end md:px-8 ${className}`}
    >
      {note && (
        <span className="hidden text-sm font-medium text-subtext md:mr-auto md:block">
          {note}
        </span>
      )}
      <div className="flex w-full gap-3 md:w-auto [&>*]:flex-1 md:[&>*]:min-w-40 md:[&>*]:flex-none">
        {children}
      </div>
    </div>
  );
}
