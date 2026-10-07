import { Link } from "react-router-dom";
import { calculateAge, isUnder5 } from "../lib/age";
import { PregnantBadge, Under5Badge } from "./Badges";
import type { Patient } from "../types";

export function PatientCard({ p }: { p: Patient }) {
  const age = calculateAge(p.dob);
  return (
    <Link
      to={`/patients/${p.id}`}
      className="card block transition-colors hover:border-prima-500"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold">{p.fullName}</p>
        <span className="text-sm font-semibold text-prima-500">
          {p.cardNumber}
        </span>
      </div>
      <p className="text-subtext">
        {age.label} · {p.gender === "FEMALE" ? "Female" : "Male"} · {p.village}
      </p>
      {p.phone && <p>{p.phone}</p>}
      {(p.isPregnant || isUnder5(age)) && (
        <div className="mt-2 flex gap-2">
          {p.isPregnant && <PregnantBadge />}
          {isUnder5(age) && <Under5Badge />}
        </div>
      )}
    </Link>
  );
}
