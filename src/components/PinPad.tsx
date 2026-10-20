import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { PIN_LENGTH } from "../lib/pin";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinPad({
  onComplete,
  disabled = false,
}: {
  onComplete: (pin: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const press = (d: string) => {
    if (disabled || value.length >= PIN_LENGTH) return;
    const next = value + d;
    setValue(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  };
  const back = () => setValue((v) => v.slice(0, -1));

  // A real keyboard works too (laptops)
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="space-y-5">
      <div
        className="flex justify-center gap-3"
        role="status"
        aria-label={`${value.length} of ${PIN_LENGTH} digits entered`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`size-4 rounded-full ${i < value.length ? "bg-prima-500" : "bg-line"}`}
          />
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-label={k === "⌫" ? "Delete last digit" : k}
              className="flex h-16 items-center justify-center rounded-2xl border-2 border-line bg-white text-2xl font-semibold hover:bg-prima-50 disabled:opacity-40"
              onClick={() => (k === "⌫" ? back() : press(k))}
            >
              {k === "⌫" ? <Delete size={24} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
