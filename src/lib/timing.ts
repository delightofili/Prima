export function timed<T>(fn: () => T): { value: T; ms: number } {
  const t0 = performance.now();
  const value = fn();
  return { value, ms: performance.now() - t0 };
}

export interface TimingRecord {
  kind: "quick" | "full";
  ms: number; // from opening the form to saving
  taps: number;
  at: number;
}

export const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface TimingSummary {
  count: number;
  seconds: number; // median
  taps: number; // median
}

export function summarize(
  records: TimingRecord[],
): Record<"quick" | "full", TimingSummary | null> {
  const one = (kind: TimingRecord["kind"]): TimingSummary | null => {
    const mine = records.filter((r) => r.kind === kind);
    if (mine.length === 0) return null;
    return {
      count: mine.length,
      seconds: Math.round(median(mine.map((r) => r.ms)) / 100) / 10,
      taps: Math.round(median(mine.map((r) => r.taps))),
    };
  };
  return { quick: one("quick"), full: one("full") };
}
