export interface StepSpec {
  min: number;
  max: number;
  step: number;
  start: number; // where the first tap on an empty box begins
  decimals: number;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const roundTo = (n: number, decimals: number) => Number(n.toFixed(decimals)); // 36.8 + 0.1 must be 36.9, not 36.900000000000006

// The value after one press of + (direction 1) or - (direction -1)
export function nextValue(
  current: number | undefined,
  direction: 1 | -1,
  spec: StepSpec,
  multiplier = 1,
): number {
  if (current === undefined || !Number.isFinite(current))
    return clamp(roundTo(spec.start, spec.decimals), spec.min, spec.max);
  return clamp(
    roundTo(current + direction * spec.step * multiplier, spec.decimals),
    spec.min,
    spec.max,
  );
}

// Holding a button speeds up: one step at first, then five, then ten
export const speedFor = (tick: number) => (tick < 8 ? 1 : tick < 20 ? 5 : 10);

// What the nurse typed. A comma works as a decimal point ("36,8"). Anything that is not a number is "empty".
export function parseTyped(text: string): number | undefined {
  const t = text.trim().replace(",", ".");
  if (t === "" || t === "." || t === "-") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export const showValue = (value: number | undefined, decimals: number) =>
  value === undefined || !Number.isFinite(value) ? "" : value.toFixed(decimals);
