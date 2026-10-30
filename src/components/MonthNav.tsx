import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthOf, shiftMonth, todayISO } from "../lib/utils";
import { useI18n } from "../i18n";
import { useMonthLabel } from "../hooks/useMonthLabel";

const ARROW =
  "inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-page disabled:opacity-30";

export function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const { t } = useI18n();
  const monthLabel = useMonthLabel();
  const isCurrent = month === monthOf(todayISO());
  return (
    <div className="card flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label={t("dash.prevMonth")}
        className={ARROW}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft size={22} />
      </button>
      <p className="text-lg font-bold">{monthLabel(month)}</p>
      <button
        type="button"
        aria-label={t("dash.nextMonth")}
        className={ARROW}
        disabled={isCurrent}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
