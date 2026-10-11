import { Link } from "react-router-dom";
import { FREE_PATIENT_LIMIT, LIMIT_WARNING } from "../lib/plan";

export function PatientLimitBar({ used }: { used: number }) {
  const pct = Math.min(100, Math.round((used / FREE_PATIENT_LIMIT) * 100));
  const tone =
    used >= FREE_PATIENT_LIMIT
      ? "bg-danger"
      : used >= LIMIT_WARNING
        ? "bg-accent-500"
        : "bg-prima-500";

  return (
    <div className="card mb-4 space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Free plan</span>
        <span>
          {used} / {FREE_PATIENT_LIMIT} patients
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={FREE_PATIENT_LIMIT}
      >
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {used >= LIMIT_WARNING && used < FREE_PATIENT_LIMIT && (
        <p className="text-sm text-subtext">
          {FREE_PATIENT_LIMIT - used} spots left.{" "}
          <Link to="/plans" className="font-semibold text-prima-500 underline">
            See plans
          </Link>
        </p>
      )}
    </div>
  );
}
