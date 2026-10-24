/* import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
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
      <p className="flex items-center gap-1.5 text-subtext">
        <MapPin size={16} /> {age.label} ·{" "}
        {p.gender === "FEMALE" ? "Female" : "Male"} · {p.village}
      </p>
      {p.phone && (
        <p className="flex items-center gap-1.5">
          <Phone size={16} className="text-subtext" /> {p.phone}
        </p>
      )}
      {(p.isPregnant || isUnder5(age)) && (
        <div className="mt-2 flex gap-2">
          {p.isPregnant && <PregnantBadge />}
          {isUnder5(age) && <Under5Badge />}
        </div>
      )}
    </Link>
  );
}
 */

import { encodeCard } from "../lib/cardCode";
import type { Patient } from "../types";
import { Logo } from "./Logo";
import { QrSvg } from "./QrSvg";

const BIRTH = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// A long name gets smaller letters so the whole name still fits, instead of being cut off
const nameSize = (name: string) =>
  name.length > 34
    ? "text-[3.2mm]"
    : name.length > 22
      ? "text-[3.8mm]"
      : "text-[4.4mm]";

// Bank-card size: 85.6 by 54 mm. The QR holds the card number only.
export function PatientCard({
  patient,
  facilityName,
}: {
  patient: Patient;
  facilityName: string;
}) {
  const born = BIRTH.format(new Date(`${patient.dob}T00:00:00`));

  return (
    <div className="id-card relative flex h-[54mm] w-[85.6mm] flex-col justify-between overflow-hidden rounded-[3mm] border-[0.4mm] border-prima-500 bg-white p-[3.5mm] text-black">
      <div className="flex items-center justify-between">
        <Logo size={22} />
        <p className="max-w-[48mm] truncate text-right text-[2.6mm] font-semibold leading-tight">
          {facilityName}
        </p>
      </div>

      <div className="flex items-end justify-between gap-[3mm]">
        <div className="min-w-0 space-y-[1.2mm]">
          <p
            className={`line-clamp-2 break-words font-bold leading-tight ${nameSize(patient.fullName)}`}
          >
            {patient.fullName}
          </p>
          <p className="text-[2.8mm] leading-tight">
            {patient.gender === "FEMALE" ? "Female" : "Male"} · Born {born}
          </p>
          <p className="text-[2.2mm] uppercase tracking-wide text-black/60">
            Card number
          </p>
          <p className="font-mono text-[5mm] font-bold leading-none tracking-wider">
            {patient.cardNumber}
          </p>
        </div>
        <QrSvg
          text={encodeCard(patient.cardNumber)}
          className="size-[24mm] shrink-0"
        />
      </div>

      <p className="text-[2.2mm] leading-tight text-black/70">
        Bring this card to every visit. Keep it dry and safe.
      </p>
    </div>
  );
}
