import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { usePlan } from "../hooks/usePlan";
import { useI18n } from "../i18n";
import {
  FREE_PATIENT_LIMIT,
  isNearLimit,
  isOverPlan,
  spotsLeft,
} from "../lib/plan";

// A clinic is never stopped from registering a patient. Near the Free plan limit, and past it, this says what is true:
// the new patients are saved, on this phone only, until the plan is upgraded (the cloud holds 200 on Free).
export function OverPlanNotice() {
  const { t, tp } = useI18n();
  const plan = usePlan();
  const { role } = useAuth();
  const { total } = usePatients("");
  const over = isOverPlan(plan, total);
  if (!over && !isNearLimit(plan, total)) return null;
  return (
    <div
      role="status"
      className="mb-4 space-y-2 rounded-2xl border-2 border-accent-500 bg-accent-50 p-3"
    >
      <p className="flex items-start gap-2 font-semibold">
        <TriangleAlert size={22} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          {over
            ? t("limit.over", { limit: FREE_PATIENT_LIMIT })
            : tp("limit.near", spotsLeft(plan, total) ?? 0)}
        </span>
      </p>
      {over && <p>{t("limit.backup")}</p>}
      {role === "admin" ? (
        <Link to="/plans" className="btn btn-secondary sm:w-56">
          {t("plan.seePlans")}
        </Link>
      ) : (
        <p className="text-subtext">{t("plans.askAdmin")}</p>
      )}
    </div>
  );
}
