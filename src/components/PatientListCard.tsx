import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import { calculateAge, isUnder5 } from "../lib/age";
import { PregnantBadge, Under5Badge } from "./Badges";
import type { Patient } from "../types";

export function PatientListCard({ patient }: { patient: Patient }) {
  const age = calculateAge(patient.dob);

  return (
    <Link
      to={`/patients/${patient.id}`}
      className="card block transition-colors hover:border-prima-500"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold">{patient.fullName}</p>
        <span className="text-sm font-semibold text-prima-500">
          {patient.cardNumber}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-subtext">
        <MapPin size={16} /> {age.label} ·{" "}
        {patient.gender === "FEMALE" ? "Female" : "Male"} · {patient.village}
      </p>
      {patient.phone && (
        <p className="flex items-center gap-1.5">
          <Phone size={16} className="text-subtext" /> {patient.phone}
        </p>
      )}
      {(patient.isPregnant || isUnder5(age)) && (
        <div className="mt-2 flex gap-2">
          {patient.isPregnant && <PregnantBadge />}
          {isUnder5(age) && <Under5Badge />}
        </div>
      )}
    </Link>
  );
}
