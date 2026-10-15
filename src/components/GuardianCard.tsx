import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Phone, Users } from "lucide-react";
import { calculateAge } from "../lib/age";
import { relationshipLabel } from "../lib/guardians";
import { formatPhone } from "../lib/utils";
import type { Guardian, Patient } from "../types";

interface Props {
  guardian: Guardian;
  kids: Patient[];
  linkKids?: boolean;
  footer?: ReactNode;
}

export function GuardianCard({
  guardian,
  kids,
  linkKids = true,
  footer,
}: Props) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <Users size={18} className="shrink-0 text-prima-500" />
            <span className="truncate">{guardian.fullName}</span>
          </p>
          <p className="text-subtext">
            {relationshipLabel(guardian.relationship)}
            {guardian.phone ? ` · ${formatPhone(guardian.phone)}` : ""}
          </p>
        </div>
        {guardian.phone && (
          <a
            href={`tel:${guardian.phone}`}
            aria-label={`Call ${guardian.fullName}`}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-prima-500 text-white hover:bg-prima-900"
          >
            <Phone size={20} />
          </a>
        )}
      </div>

      {kids.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {kids.map((k) => {
            const label = `${k.fullName} · ${calculateAge(k.dob).label}`;
            const chip =
              "inline-flex min-h-11 items-center rounded-full bg-prima-50 px-4 text-sm font-semibold text-prima-900";
            return (
              <li key={k.id}>
                {linkKids ? (
                  <Link to={`/patients/${k.id}`} className={chip}>
                    {label}
                  </Link>
                ) : (
                  <span className={chip}>{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-subtext">No children linked yet.</p>
      )}

      {footer}
    </div>
  );
}
