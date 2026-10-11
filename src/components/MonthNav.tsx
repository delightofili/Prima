import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, monthOf, shiftMonth, todayISO } from "../lib/utils";

const ARROW =
  "inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-page disabled:opacity-30";

export function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const isCurrent = month === monthOf(todayISO());
  return (
    <div className="card flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label="Previous month"
        className={ARROW}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft size={22} />
      </button>
      <p className="text-lg font-bold">{monthLabel(month)}</p>
      <button
        type="button"
        aria-label="Next month"
        className={ARROW}
        disabled={isCurrent}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
