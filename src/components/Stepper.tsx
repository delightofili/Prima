import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Minus, Plus } from "lucide-react";
import {
  nextValue,
  parseTyped,
  showValue,
  speedFor,
  type StepSpec,
} from "../lib/stepper";

interface Props extends StepSpec {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  inputMode?: "numeric" | "decimal";
}

// A number box with big minus and plus buttons. Tap for one step, hold to run faster. Typing still works.
export function Stepper({
  label,
  unit,
  value,
  onChange,
  error,
  inputMode = "decimal",
  ...spec
}: Props) {
  const [draft, setDraft] = useState<string | null>(null); // what is being typed right now, such as "36."
  const valueRef = useRef(value);
  const specRef = useRef<StepSpec>(spec);
  const changeRef = useRef(onChange);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef(0);

  useEffect(() => {
    valueRef.current = value;
    specRef.current = spec;
    changeRef.current = onChange;
  });

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const press = (direction: 1 | -1, multiplier = 1) => {
    const next = nextValue(
      valueRef.current,
      direction,
      specRef.current,
      multiplier,
    );
    valueRef.current = next; // a held button keeps counting before the screen has caught up
    setDraft(null);
    changeRef.current(next);
  };

  const hold = (direction: 1 | -1) => (e: PointerEvent) => {
    e.preventDefault(); // no text selection or long-press menu while holding
    stop();
    press(direction);
    tick.current = 0;
    timer.current = setTimeout(function loop() {
      tick.current += 1;
      press(direction, speedFor(tick.current));
      timer.current = setTimeout(loop, 90);
    }, 400);
  };

  // A screen reader or the keyboard activates a button with a click that has no position (detail 0)
  const assist = (direction: 1 | -1) => (e: MouseEvent) => {
    if (e.detail === 0) press(direction);
  };

  const shown = draft ?? showValue(value, spec.decimals);
  const buttons = (direction: 1 | -1) => ({
    type: "button" as const,
    className: "stepper-btn",
    "aria-label": `${direction === 1 ? "Increase" : "Decrease"} ${label}`,
    onPointerDown: hold(direction),
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onClick: assist(direction),
  });

  return (
    <div role="group" aria-label={label} className="space-y-1">
      <span className="text-base font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <button {...buttons(-1)}>
          <Minus size={26} />
        </button>
        <div className="relative min-w-0 flex-1">
          <input
            className="input pr-12 text-center text-xl font-semibold tabular-nums"
            inputMode={inputMode}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            value={shown}
            placeholder={showValue(spec.start, spec.decimals)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              setDraft(e.target.value);
              const typed = parseTyped(e.target.value);
              valueRef.current = typed;
              changeRef.current(typed);
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                press(e.key === "ArrowUp" ? 1 : -1);
              }
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-subtext">
            {unit}
          </span>
        </div>
        <button {...buttons(1)}>
          <Plus size={26} />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
