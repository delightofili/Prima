import { useMemo } from "react";
import { CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import { useI18n } from "../i18n";
import { applySuggestion, checkComplaint } from "../lib/complaintCheck";

// Sits under the complaint box. It helps, it never blocks: an emergency must always be savable.
// The names of complaints (Fever, Cough) stay in English on purpose, so records and reports read the same everywhere.
export function ComplaintHint({
  value,
  onReplace,
}: {
  value: string;
  onReplace: (next: string) => void;
}) {
  const { t } = useI18n();
  const r = useMemo(() => checkComplaint(value), [value]);
  const long = value.trim().length >= 6; // do not say "not recognised" while the first letters are still being typed
  if (r.status === "empty" && r.flags.length === 0) return null;

  return (
    <div aria-live="polite" className="space-y-2 text-sm">
      {r.flags.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-accent-50 p-3 font-medium">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          {t(
            r.flags.includes("contains_email")
              ? "complaint.warnEmail"
              : "complaint.warnPhone",
          )}
        </p>
      )}

      {r.recognized.length > 0 && (
        <p className="flex items-start gap-2 text-prima-900">
          <CircleCheck size={18} className="mt-0.5 shrink-0 text-prima-500" />
          {t("complaint.recognised", { terms: r.recognized.join(", ") })}
        </p>
      )}

      {r.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-subtext">{t("complaint.didYouMean")}</p>
          <div className="flex flex-wrap gap-2">
            {r.suggestions.map((s) => (
              <button
                key={`${s.from}-${s.to}`}
                type="button"
                className="min-h-11 rounded-full border-2 border-prima-500 px-4 font-semibold text-prima-500 hover:bg-prima-50"
                onClick={() => onReplace(applySuggestion(value, s.from, s.to))}
              >
                {s.from} → {s.to}
              </button>
            ))}
          </div>
        </div>
      )}

      {r.status === "unclear" && long && (
        <p className="flex items-start gap-2 text-subtext">
          <CircleHelp size={18} className="mt-0.5 shrink-0" />
          {t(r.vague ? "complaint.vague" : "complaint.unknown")}
        </p>
      )}
    </div>
  );
}
