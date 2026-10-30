import { useI18n } from "../i18n";
import { localeFor } from "../i18n/core";

// "2026-10" as "October 2026" in the person's own language (the weekday and month names come from the browser)
export function useMonthLabel() {
  const { lang } = useI18n();
  return (month: string) => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(localeFor(lang), {
      month: "long",
      year: "numeric",
    });
  };
}
