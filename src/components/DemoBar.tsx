import { FlaskConical } from "lucide-react";
import { useI18n } from "../i18n";
import { isDemo } from "../lib/demo";
import { leavePractice, restartPractice } from "../lib/demoSetup";

// Shown at the top of every screen for as long as practice mode is on, so nobody ever mistakes a practice for the real thing
export function DemoBar() {
  const { t } = useI18n();
  if (!isDemo()) return null;
  return (
    <div
      role="region"
      aria-label={t("demo.label")}
      className="sticky top-0 z-20 -mx-4 mb-4 space-y-3 border-b-2 border-accent-500 bg-accent-50 px-4 py-3 md:-mx-8 md:px-8"
    >
      <p className="flex items-start gap-2 font-semibold">
        <FlaskConical size={22} className="mt-0.5 shrink-0" aria-hidden />{" "}
        <span>{t("demo.banner")}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary sm:w-60"
          onClick={() => void restartPractice()}
        >
          {t("demo.reset")}
        </button>
        <button
          type="button"
          className="btn btn-primary sm:w-60"
          onClick={() => void leavePractice()}
        >
          {t("demo.leave")}
        </button>
      </div>
    </div>
  );
}
